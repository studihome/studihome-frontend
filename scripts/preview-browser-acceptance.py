#!/usr/bin/env python3
"""Dependency-free Vercel Preview browser acceptance via ChromeDriver HTTP."""

from __future__ import annotations

import argparse
import base64
import http.cookies
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ELEMENT_KEY = "element-6066-11e4-a52e-4f735466cecf"
THIRD_PARTY = (
    "chrome-extension://", "youtube.com", "youtube-nocookie.com", "googlevideo.com",
    "doubleclick.net", "googlesyndication.com", "google-analytics.com",
    "googletagmanager.com", "fonts.googleapis.com", "fonts.gstatic.com",
)


class AcceptanceError(RuntimeError):
    pass


class PreviewAccessBlocked(AcceptanceError):
    """The selected Preview exists but platform protection prevents app access."""
    pass


class AcceptancePrerequisiteBlocked(AcceptanceError):
    """Required protected acceptance credentials or fixtures are unavailable."""
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AcceptanceError(message)


def normalize_base_url(value: str) -> str:
    parsed = urllib.parse.urlparse(str(value or "").strip())
    require(parsed.scheme == "https", "Preview URL must use HTTPS")
    require(bool(parsed.netloc), "Preview URL must include a host")
    require(not parsed.username and not parsed.password, "Preview URL must not contain credentials")
    host = (parsed.hostname or "").lower()
    require(host.endswith(".vercel.app"), "Preview URL host must end with .vercel.app")
    require(parsed.port is None, "Preview URL must not specify a custom port")
    return f"https://{host}"


def preview_destination_issue(value: str, expected_host: str) -> tuple[str, str] | None:
    parsed = urllib.parse.urlparse(str(value or ""))
    host = (parsed.hostname or "").lower()
    expected = str(expected_host or "").lower()
    if host == expected:
        return None

    if host in {"vercel.com", "www.vercel.com"} and (
        parsed.path.startswith("/login") or parsed.path.startswith("/sso-api")
    ):
        return (
            "blocked",
            "Vercel Deployment Protection/SSO redirected the Preview browser "
            f"to {host}{parsed.path}; Studihome did not load.",
        )

    return (
        "unexpected-origin",
        f"Preview navigation left expected host {expected!r} for {host!r}.",
    )



class NoRedirect(urllib.request.HTTPRedirectHandler):
    """Capture Vercel bypass-cookie redirects without forwarding secret headers."""

    def redirect_request(
        self,
        req: urllib.request.Request,
        fp: Any,
        code: int,
        msg: str,
        headers: Any,
        newurl: str,
    ) -> None:
        return None


def protection_headers(secret: str) -> dict[str, str]:
    value = str(secret or "")
    if not value:
        return {}
    return {
        "x-vercel-protection-bypass": value,
        "x-vercel-set-bypass-cookie": "true",
        "User-Agent": "Studihome-Preview-Acceptance/1.0",
    }


def parse_bypass_cookies(values: list[str], preview_url: str) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    for raw in values:
        parsed = http.cookies.SimpleCookie()
        parsed.load(str(raw or ""))
        for name, morsel in parsed.items():
            if name and morsel.value:
                result.append({"name": name, "value": morsel.value, "url": preview_url})
    return result


def fetch_bypass_cookies(preview_url: str, secret: str) -> list[dict[str, str]]:
    headers = protection_headers(secret)
    if not headers:
        return []

    url = preview_url.rstrip("/") + "/api/version"
    request = urllib.request.Request(url, headers=headers, method="GET")
    opener = urllib.request.build_opener(NoRedirect())
    response_headers: Any = None
    location = ""
    try:
        with opener.open(request, timeout=30) as response:
            response_headers = response.headers
            location = str(response.headers.get("Location") or "")
            response.read(1024)
    except urllib.error.HTTPError as exc:
        if 300 <= exc.code < 400:
            response_headers = exc.headers
            location = str(exc.headers.get("Location") or "")
        elif exc.code in {401, 403}:
            raise PreviewAccessBlocked(
                "Vercel Automation Bypass was configured but rejected; Studihome did not load."
            ) from exc
        else:
            raise AcceptanceError(
                f"Vercel Automation Bypass bootstrap returned HTTP {exc.code}."
            ) from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise AcceptanceError(f"Vercel Automation Bypass bootstrap failed: {exc}") from exc

    if location:
        destination = urllib.parse.urljoin(url, location)
        issue = preview_destination_issue(
            destination,
            urllib.parse.urlparse(preview_url).netloc,
        )
        if issue is not None and issue[0] == "blocked":
            raise PreviewAccessBlocked(
                "Vercel Automation Bypass was configured but Deployment Protection still redirected to login."
            )

    raw_cookies = (
        list(response_headers.get_all("Set-Cookie") or [])
        if response_headers is not None
        else []
    )
    cookies = parse_bypass_cookies(raw_cookies, preview_url)
    require(bool(cookies), "Vercel Automation Bypass did not return an authorization cookie.")
    return cookies


def classify_log(entry: dict[str, Any], host: str) -> str | None:
    level = str(entry.get("level") or "").upper()
    message = str(entry.get("message") or "")
    if level not in {"SEVERE", "ERROR"}:
        return None
    lower = message.lower()
    if any(marker in lower for marker in THIRD_PARTY):
        return None
    critical = (
        "uncaught", "unhandled", "syntaxerror", "referenceerror", "typeerror",
        "content security policy", "violates the following content security policy",
    )
    same_host_failure = host.lower() in lower and (
        "failed to load resource" in lower or "net::err_" in lower
    )
    if same_host_failure or any(token in lower for token in critical):
        return f"{level}: {message}"
    return None


class Driver:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.session = ""

    def request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
        data = None if payload is None else json.dumps(payload).encode()
        req = urllib.request.Request(
            self.base_url + path, data=data, method=method,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                parsed = json.loads(res.read().decode() or "{}")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", "replace")
            raise AcceptanceError(f"ChromeDriver HTTP {exc.code}: {body}") from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            raise AcceptanceError(f"ChromeDriver request failed: {exc}") from exc
        value = parsed.get("value")
        if isinstance(value, dict) and value.get("error"):
            raise AcceptanceError(f"{value.get('error')}: {value.get('message')}")
        return value

    def start(self) -> None:
        value = self.request("POST", "/session", {
            "capabilities": {"alwaysMatch": {
                "browserName": "chrome",
                "goog:chromeOptions": {"args": [
                    "--headless=new", "--no-sandbox", "--disable-gpu",
                    "--disable-dev-shm-usage", "--disable-extensions",
                    "--window-size=1440,1000",
                ]},
                "goog:loggingPrefs": {"browser": "ALL"},
            }}
        })
        require(isinstance(value, dict) and value.get("sessionId"), "ChromeDriver session id missing")
        self.session = str(value["sessionId"])

    def close(self) -> None:
        if self.session:
            try:
                self.request("DELETE", f"/session/{self.session}")
            finally:
                self.session = ""

    def path(self, suffix: str) -> str:
        require(bool(self.session), "ChromeDriver session not active")
        return f"/session/{self.session}{suffix}"

    def cdp(self, command: str, params: dict[str, Any]) -> Any:
        return self.request(
            "POST",
            self.path("/goog/cdp/execute"),
            {"cmd": command, "params": params},
        )

    def set_cookie(self, cookie: dict[str, str]) -> None:
        value = self.cdp("Network.setCookie", dict(cookie))
        if isinstance(value, dict) and value.get("success") is False:
            raise AcceptanceError(f"Chrome rejected bypass cookie {cookie.get('name')!r}")

    def nav(self, url: str) -> None:
        self.request("POST", self.path("/url"), {"url": url})

    def current_url(self) -> str:
        value = self.request("GET", self.path("/url"))
        return str(value or "")

    def js(self, code: str, *args: Any) -> Any:
        return self.request("POST", self.path("/execute/sync"), {"script": code, "args": list(args)})

    def find(self, selector: str) -> str:
        value = self.request("POST", self.path("/element"), {"using": "css selector", "value": selector})
        require(isinstance(value, dict) and ELEMENT_KEY in value, f"Element not found: {selector}")
        return str(value[ELEMENT_KEY])

    def click(self, selector: str) -> None:
        self.request("POST", self.path(f"/element/{self.find(selector)}/click"), {})

    def keys(self, selector: str, text: str) -> None:
        self.request(
            "POST", self.path(f"/element/{self.find(selector)}/value"),
            {"text": text, "value": list(text)},
        )

    def size(self, width: int, height: int) -> None:
        self.request("POST", self.path("/window/rect"), {"width": width, "height": height})

    def logs(self) -> list[dict[str, Any]]:
        value = self.request("POST", self.path("/se/log"), {"type": "browser"})
        return value if isinstance(value, list) else []

    def screenshot(self, path: str) -> None:
        value = self.request("GET", self.path("/screenshot"))
        if isinstance(value, str) and value:
            Path(path).write_bytes(base64.b64decode(value))


def wait_js(driver: Driver, code: str, label: str, timeout: float = 20) -> Any:
    deadline = time.monotonic() + timeout
    last = None
    while time.monotonic() < deadline:
        try:
            last = driver.js(code)
            if last:
                return last
        except AcceptanceError:
            pass
        time.sleep(0.25)
    raise AcceptanceError(f"Timed out waiting for {label}; last={last!r}")


def visible(selector: str) -> str:
    return f"""
    const el=document.querySelector({json.dumps(selector)});
    if(!el)return false;
    const s=getComputedStyle(el);
    return !el.classList.contains('hidden')&&s.display!=='none'&&s.visibility!=='hidden';
    """


def require_preview_origin(driver: Driver, expected_host: str) -> None:
    current = driver.current_url()
    issue = preview_destination_issue(current, expected_host)
    if issue is None:
        return
    kind, message = issue
    if kind == "blocked":
        raise PreviewAccessBlocked(message)
    raise AcceptanceError(message)


def wait_app(driver: Driver, expected_host: str) -> None:
    deadline = time.monotonic() + 30
    last = None
    while time.monotonic() < deadline:
        require_preview_origin(driver, expected_host)
        try:
            last = driver.js("""
              return document.readyState==='complete' && !!window.App && !!App.ui && !!App.search
                && !!App.auth && !!App.router && !!App.studioAI && !!window.StudihomePWA;
            """)
            if last:
                return
        except PreviewAccessBlocked:
            raise
        except AcceptanceError:
            pass
        time.sleep(0.25)
    raise AcceptanceError(f"Timed out waiting for Studihome App boot; last={last!r}")



def run_authenticated_checkout_dry_run(
    driver: Driver,
    email: str,
    password: str,
) -> dict[str, Any]:
    if not email or not password:
        raise AcceptancePrerequisiteBlocked(
            "Authenticated checkout secrets STUDIHOME_E2E_EMAIL/STUDIHOME_E2E_PASSWORD are not configured."
        )

    driver.js("App.ui.toggleModal('auth-modal',true); App.auth.toggleAuthMode('login'); return true;")
    wait_js(driver, visible("#login-form"), "authenticated login form")
    driver.keys("#login-email", email)
    driver.keys("#login-password", password)
    driver.js("document.getElementById('login-form').requestSubmit(); return true;")
    user = wait_js(
        driver,
        "return App.state.user && App.state.user.id ? {id:App.state.user.id,role:String(App.state.user.role||'')} : null;",
        "authenticated member session",
        30,
    )
    role = str((user or {}).get("role") or "").lower()
    require(role not in {"admin", "staff"}, "E2E checkout account must be a non-admin member")

    candidate = driver.js("""
      const products=(App.state.publicData?.products||[]).filter(
        p => !p.isFree && Number(p.price)>0 && App.products.getUserProductStatus(p.id)==='AVAILABLE'
      );
      const p=products[0];
      return p ? {id:p.id,title:p.title,price:Number(p.price)} : null;
    """)
    require(bool(candidate and candidate.get("id")), "No safe AVAILABLE paid product exists for the E2E member")

    prepared = driver.js("""
      const p=(App.state.publicData?.products||[]).find(x=>x.id===arguments[0]);
      if(!p)return false;
      window.__studihomeE2EOriginalPost=App.api.post;
      window.__studihomeE2ECalls=[];
      App.api.post=async function(action,payload={}){
        if(action==='CREATE_ORDER'){
          window.__studihomeE2ECalls.push({action,productId:payload.productId||''});
          return {orderId:'preview-e2e-order'};
        }
        if(action==='SUBMIT_PAYMENT'){
          window.__studihomeE2ECalls.push({action,orderId:payload.orderId||''});
          return {success:true};
        }
        if(action==='GET_MEMBER_DASHBOARD'){
          return App.state.memberData;
        }
        return window.__studihomeE2EOriginalPost.call(App.api,action,payload);
      };
      window.open=()=>null;
      const master=App.state.publicData.master||(App.state.publicData.master={});
      const slots=Array.isArray(master.qrisSlots)?master.qrisSlots:[];
      master.qrisSlots=[
        ...slots.filter(q=>Number(q.price)!==Number(p.price)),
        {price:Number(p.price),qrisUrl:location.origin+'/icons/icon-192.png'}
      ];
      App.shop.startCheckout(p.id);
      return true;
    """, str(candidate["id"]))
    require(bool(prepared), "Unable to prepare non-mutating checkout dry-run")

    wait_js(driver, visible("#checkout-modal"), "checkout modal")
    wait_js(
        driver,
        "return !!document.querySelector('#checkout-modal-content [data-shop-submit=\"order-step1\"]');",
        "checkout step 1",
    )
    if not driver.js("return !!document.getElementById('co-name')?.value.trim();"):
        driver.js("document.getElementById('co-name').value='Preview E2E Member'; return true;")
    if not driver.js("return !!document.getElementById('co-phone')?.value.trim();"):
        driver.js("document.getElementById('co-phone').value='628111111111'; return true;")

    driver.js(
        "document.querySelector('#checkout-modal-content [data-shop-submit=\"order-step1\"]').requestSubmit(); return true;"
    )
    wait_js(driver, "return !!document.getElementById('confirm-payment-checkbox');", "checkout payment step", 30)
    require(
        driver.js("return App.state.checkout.orderId==='preview-e2e-order';"),
        "Checkout Step 1 did not use the non-mutating synthetic order",
    )

    require(
        driver.js("return document.getElementById('btn-confirm-payment')?.disabled===true;"),
        "Payment confirm must start disabled",
    )
    driver.click("#confirm-payment-checkbox")
    wait_js(
        driver,
        "return document.getElementById('btn-confirm-payment')?.disabled===false;",
        "payment confirm enabled",
    )
    driver.click("#btn-confirm-payment")
    wait_js(
        driver,
        "return document.getElementById('checkout-modal')?.classList.contains('hidden');",
        "checkout close after confirmation",
        30,
    )

    calls = driver.js("return window.__studihomeE2ECalls||[];")
    actions = [str(item.get("action") or "") for item in (calls or []) if isinstance(item, dict)]
    require(
        actions == ["CREATE_ORDER", "SUBMIT_PAYMENT"],
        f"Unexpected checkout mutation interception sequence: {actions!r}",
    )

    driver.js("""
      if(window.__studihomeE2EOriginalPost){
        App.api.post=window.__studihomeE2EOriginalPost;
        delete window.__studihomeE2EOriginalPost;
      }
      return true;
    """)

    return {
        "role": role,
        "product_id": str(candidate["id"]),
        "mutations_intercepted": actions,
        "database_mutation": False,
    }


def run(preview_url: str, driver_url: str, screenshot: str, bypass_secret: str = "", e2e_email: str = "", e2e_password: str = "") -> None:
    preview_url = normalize_base_url(preview_url)
    host = urllib.parse.urlparse(preview_url).netloc
    bypass_cookies = fetch_bypass_cookies(preview_url, bypass_secret)
    d = Driver(driver_url)
    d.start()
    try:
        if bypass_cookies:
            d.cdp("Network.enable", {})
            for cookie in bypass_cookies:
                d.set_cookie(cookie)
        d.nav(preview_url)
        wait_js(d, "return document.readyState==='complete';", "initial load", 30)
        require_preview_origin(d, host)
        d.js("localStorage.setItem('studihome-pwa-dismissed-v2',String(Date.now()));return true;")
        d.nav(preview_url)
        wait_app(d, host)

        d.click("#global-search-open-desktop")
        wait_js(d, visible("#search-modal"), "Search open")
        d.keys("#global-search-modal-input", "guru")
        d.keys("#global-search-modal-input", "\ue007")
        wait_js(d, "return document.getElementById('search-modal')?.classList.contains('hidden');", "Search Enter")
        d.click("#global-search-open-desktop")
        wait_js(d, visible("#search-modal"), "Search reopen")
        d.js("document.getElementById('global-search-modal-input').value='guru';return true;")
        d.click("#global-search-submit")
        wait_js(d, "return document.getElementById('search-modal')?.classList.contains('hidden');", "Search submit")

        require(bool(d.js("""
          const m=document.getElementById('studio-smart-brief-modal');
          const i=document.getElementById('studio-smart-brief-input');
          if(!m||!i)return false;i.value='';m.classList.remove('hidden');return true;
        """)), "Unable to prepare Smart Brief")
        refinement = wait_js(
            d, "return document.querySelector('[data-studio-refinement]')?.dataset.studioRefinement||'';",
            "Smart Brief refinement",
        )
        d.click("[data-studio-refinement]")
        require(bool(d.js(
            "return document.getElementById('studio-smart-brief-input')?.value.includes(arguments[0]);",
            refinement,
        )), "Smart Brief refinement did not update input")
        d.click("#studio-smart-close-icon")
        wait_js(d, "return document.getElementById('studio-smart-brief-modal')?.classList.contains('hidden');", "Smart Brief close")

        d.js("App.ui.toggleModal('auth-modal',true);return true;")
        wait_js(d, visible("#auth-modal"), "Auth open")
        d.click("#login-form [data-auth-mode='register']")
        wait_js(d, "return document.getElementById('auth-modal-title')?.textContent==='Pendaftaran Akun Baru';", "register mode")
        d.click("#register-form [data-auth-mode='login']")
        wait_js(d, "return document.getElementById('auth-modal-title')?.textContent==='Masuk ke Studihome';", "login mode")
        d.click("#login-form [data-auth-mode='forgot-password']")
        wait_js(d, "return document.getElementById('auth-modal-title')?.textContent==='Lupa Password';", "forgot mode")
        d.click("#forgot-form [data-auth-mode='login']")
        d.click("#auth-modal-close")
        wait_js(d, "return document.getElementById('auth-modal')?.classList.contains('hidden');", "Auth close")

        d.js("localStorage.removeItem('studihome-pwa-dismissed-v2');return true;")
        d.click("#pwa-install-link")
        wait_js(d, "return !!document.querySelector('.sh-pwa-overlay.show');", "PWA overlay")
        if d.js("return !!document.querySelector('.sh-pwa-overlay.show .sh-pwa-dismiss');"):
            d.click(".sh-pwa-overlay.show .sh-pwa-dismiss")

        require(bool(d.js("""
          const m=document.getElementById('product-detail-modal'),c=document.getElementById('product-detail-modal-content');
          if(!m||!c)return false;m.classList.remove('hidden');
          c.innerHTML='<iframe src="about:blank#preview-acceptance"></iframe>';return true;
        """)), "Unable to prepare product modal")
        d.click("#product-detail-modal-close")
        wait_js(d, "return document.getElementById('product-detail-modal')?.classList.contains('hidden');", "Product close")
        require(bool(d.js("return document.querySelector('#product-detail-modal iframe')?.getAttribute('src')==='';")),
                "Product iframe cleanup ordering changed")

        d.js("document.getElementById('checkout-modal').classList.remove('hidden');return true;")
        d.click("#checkout-modal-close")
        wait_js(d, "return document.getElementById('checkout-modal')?.classList.contains('hidden');", "Checkout close")

        d.js("""
          const m=document.getElementById('module-modal'),c=document.getElementById('module-modal-content');
          m.classList.remove('hidden');c.innerHTML='<iframe src="about:blank#preview-acceptance"></iframe>';return true;
        """)
        d.click("#module-modal-close")
        wait_js(d, "return document.getElementById('module-modal')?.classList.contains('hidden');", "Module close")

        wait_js(d, "return !!document.querySelector('#top-auth-area [data-top-auth-action=\"login\"]');",
                "top-auth login", 30)
        d.click("#top-auth-area [data-top-auth-action='login']")
        wait_js(d, visible("#auth-modal"), "top-auth modal")
        d.click("#auth-modal-close")

        d.nav(preview_url)
        wait_app(d, host)
        wait_js(d, "return !!document.querySelector('#main-content [data-home-route=\"products\"]');",
                "Home products action", 30)
        d.click("#main-content [data-home-route='products']")
        wait_js(d, "return location.pathname==='/foyer';", "Home -> Foyer")

        d.nav(preview_url)
        wait_app(d, host)
        route = d.js("""
          const b=[...document.querySelectorAll('#top-nav-links [data-app-route]')]
            .find(x=>['products','home'].includes(x.dataset.appRoute));
          return b?.dataset.appRoute||'';
        """)
        if route:
            d.click(f"#top-nav-links [data-app-route='{route}']")
        else:
            d.js("""
              const b=document.createElement('button');b.id='preview-acceptance-top-route';
              b.dataset.appRoute='home';b.textContent='Preview acceptance';
              document.getElementById('top-nav-links').appendChild(b);return true;
            """)
            route = "home"
            d.click("#preview-acceptance-top-route")
        path = "/foyer" if route == "products" else "/"
        wait_js(d, f"return location.pathname==={json.dumps(path)};", f"desktop route {route}")

        d.nav(preview_url)
        d.size(390, 844)
        wait_app(d, host)
        route = d.js("""
          const b=[...document.querySelectorAll('#mobile-nav-links [data-app-route]')]
            .find(x=>['products','home'].includes(x.dataset.appRoute));
          return b?.dataset.appRoute||'';
        """)
        require(bool(route), "No safe natural mobile route action found")
        d.click(f"#mobile-nav-links [data-app-route='{route}']")
        path = "/foyer" if route == "products" else "/"
        wait_js(d, f"return location.pathname==={json.dumps(path)};", f"mobile route {route}")

        d.nav(preview_url)
        d.size(1440, 1000)
        wait_app(d, host)
        d.js("""
          const b=document.createElement('button');b.id='preview-acceptance-utility-home';
          b.dataset.globalAction='home';b.textContent='Back home';
          document.getElementById('main-content').appendChild(b);
          history.replaceState({},'', '/foyer');return true;
        """)
        d.click("#preview-acceptance-utility-home")
        wait_js(d, "return location.pathname==='/';", "utility home")

        authenticated_checkout = run_authenticated_checkout_dry_run(
            d,
            e2e_email,
            e2e_password,
        )

        findings = [x for entry in d.logs() if (x := classify_log(entry, host))]
        require(not findings, "First-party browser findings: " + " | ".join(findings))

        print(json.dumps({
            "status": "PASS",
            "preview_url": preview_url,
            "public_preview_checks": [
                "app_boot", "search_mouse_enter", "smart_brief_refinement_close",
                "auth_modes_close", "pwa_install_overlay", "product_checkout_module_close",
                "top_auth_login", "home_to_foyer", "desktop_top_shell_route",
                "mobile_top_shell_route", "utility_home", "first_party_console_runtime",
            ],
            "authenticated_checkout": authenticated_checkout,
        }, indent=2))
    except Exception:
        try:
            d.screenshot(screenshot)
        except Exception:
            pass
        raise
    finally:
        d.close()


def self_test() -> None:
    require(normalize_base_url("https://x.vercel.app/a?q=1") == "https://x.vercel.app", "URL normalization")
    try:
        normalize_base_url("https://example.com")
    except AcceptanceError:
        pass
    else:
        raise AcceptanceError("Non-Vercel host was not rejected")
    try:
        normalize_base_url("http://x.vercel.app")
    except AcceptanceError:
        pass
    else:
        raise AcceptanceError("HTTP URL was not rejected")
    require(classify_log(
        {"level": "SEVERE", "message": "https://x.vercel.app/app.js Uncaught TypeError: x"},
        "x.vercel.app",
    ) is not None, "first-party error classification")
    require(classify_log(
        {"level": "SEVERE", "message": "https://www.youtube.com/x Failed to load resource"},
        "x.vercel.app",
    ) is None, "third-party exclusion")
    require(
        preview_destination_issue("https://x.vercel.app/foyer", "x.vercel.app") is None,
        "same Preview origin classification",
    )
    blocked = preview_destination_issue(
        "https://vercel.com/login?next=%2Fsso-api",
        "x.vercel.app",
    )
    require(blocked is not None and blocked[0] == "blocked", "Vercel protection classification")
    unexpected = preview_destination_issue("https://example.com/", "x.vercel.app")
    require(
        unexpected is not None and unexpected[0] == "unexpected-origin",
        "unexpected Preview origin classification",
    )
    require(protection_headers("") == {}, "empty bypass secret")
    headers = protection_headers("example-secret")
    require(headers.get("x-vercel-protection-bypass") == "example-secret", "bypass header construction")
    require(headers.get("x-vercel-set-bypass-cookie") == "true", "bypass cookie request")
    cookies = parse_bypass_cookies(
        ["_vercel_jwt=example-cookie; Path=/; Secure; HttpOnly"],
        "https://x.vercel.app",
    )
    require(
        cookies == [{"name": "_vercel_jwt", "value": "example-cookie", "url": "https://x.vercel.app"}],
        "bypass cookie parsing",
    )
    source = Path(__file__).read_text(encoding="utf-8")
    require("window.__studihomeE2EOriginalPost=App.api.post" in source, "E2E API interception")
    require("action==='CREATE_ORDER'" in source and "action==='SUBMIT_PAYMENT'" in source, "E2E mutation interception")
    require('"database_mutation": False' in source, "E2E non-mutating result contract")
    print("Preview browser acceptance harness self-test: PASS")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--preview-url")
    p.add_argument("--driver-url", default="http://127.0.0.1:9515")
    p.add_argument("--screenshot-path", default="/tmp/studihome-preview-browser-failure.png")
    p.add_argument("--self-test", action="store_true")
    args = p.parse_args()
    if args.self_test:
        self_test()
        return 0
    url = args.preview_url or os.environ.get("PREVIEW_URL", "")
    if not url:
        p.error("--preview-url or PREVIEW_URL is required")
    run(
        url,
        args.driver_url,
        args.screenshot_path,
        os.environ.get("VERCEL_AUTOMATION_BYPASS_SECRET", ""),
        os.environ.get("STUDIHOME_E2E_EMAIL", ""),
        os.environ.get("STUDIHOME_E2E_PASSWORD", ""),
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (PreviewAccessBlocked, AcceptancePrerequisiteBlocked) as exc:
        print(f"Preview browser acceptance: BLOCKED: {exc}", file=sys.stderr)
        raise SystemExit(2)
    except AcceptanceError as exc:
        print(f"Preview browser acceptance: FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
