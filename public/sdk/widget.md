# Veylify Widget — Entegrasyon Rehberi

Veylify widget'ı, herhangi bir web sitesine tek bir `<script>` ile eklenen, bağımsız (framework-siz) ghost-font CAPTCHA'sıdır. Shadow DOM ile izole çalışır, hiçbir bağımlılığı yoktur.

**Akış:**
1. Widget `/api/v1/challenge` çağırır → imzalı token + seed alır.
2. Ghost-font'u canvas'a çizer (DOM'da metin yok — screenshot bot kör).
3. Kullanıcı etkileşimini toplar (davranış skoru).
4. Çözümü `/api/v1/verify`'a gönderir → **verification token'ı** gizli input'a yazar.
5. Form gönderiminde backend'iniz bu token'ı `/api/v1/siteverify` ile teyit eder ([rest.md](./rest.md) ve dil SDK'larına bakın).

> Görünmez modda widget önce `/api/v1/passive`'i dener; skor yeterse kullanıcı hiç CAPTCHA görmez.

> **Geriye uyum:** Eski `specter` sınıfı/olay/global adları (`.specter`, `specter-verified`, `window.Specter`) hâlâ çalışır. Yeni entegrasyonlarda Veylify adlarını kullanın.

---

## Vanilla HTML

```html
<form method="POST" action="/signup">
  <input name="email" type="email" />

  <!-- Widget buraya monte olur; gizli "veylify-token" alanını kendisi ekler -->
  <div class="veylify" data-sitekey="pk_live_xxxxxxxx"></div>

  <button type="submit">Kaydol</button>
</form>

<script src="https://veylify.com/veylify.js" async defer></script>
```

Widget, `data-sitekey` gördüğü her `.veylify` elemanını otomatik monte eder.

### data-* öznitelikleri

| Öznitelik | Açıklama | Varsayılan |
|-----------|----------|------------|
| `data-sitekey` | Site (public) anahtarı — **zorunlu** | — |
| `data-lang` | Arayüz dili (`tr`, `en`) | `<html lang>` → tarayıcı → `tr` |
| `data-response-field` | Gizli token input'unun `name`'i | `veylify-token` |

### Olaylar

Doğrulama başarılı olduğunda widget, hedef eleman üzerinde `veylify-verified` olayı yayınlar (bubbling):

```js
document.querySelector(".veylify").addEventListener("veylify-verified", function (e) {
  console.log("Doğrulandı:", e.detail); // { success/passed, token, score, ... }
  // Örn. "Gönder" butonunu etkinleştir
});
```

### Programatik montaj

```js
// Script yüklendikten sonra window.Veylify mevcut:
Veylify.render(document.getElementById("my-widget")); // tek eleman
Veylify.init(); // sayfadaki tüm .veylify[data-sitekey] elemanları
```

---

## React

```jsx
import { useEffect, useRef } from "react";

export function VeylifyWidget({ siteKey, lang = "tr", onVerified }) {
  const ref = useRef(null);

  useEffect(() => {
    // veylify.js'i bir kez yükle
    const id = "veylify-sdk";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://veylify.com/veylify.js";
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
      s.onload = () => window.Veylify && window.Veylify.render(ref.current);
    } else if (window.Veylify) {
      window.Veylify.render(ref.current);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onVerified) return;
    const handler = (e) => onVerified(e.detail);
    el.addEventListener("veylify-verified", handler);
    return () => el.removeEventListener("veylify-verified", handler);
  }, [onVerified]);

  return <div ref={ref} className="veylify" data-sitekey={siteKey} data-lang={lang} />;
}
```

Kullanım:

```jsx
<form method="POST" action="/api/signup">
  <VeylifyWidget
    siteKey="pk_live_xxxxxxxx"
    onVerified={(detail) => console.log("skor", detail.score)}
  />
  <button type="submit">Kaydol</button>
</form>
```

Gizli `veylify-token` alanı forma otomatik eklenir; normal POST'ta backend'e gider.

---

## Vue 3

```vue
<template>
  <div ref="host" class="veylify" :data-sitekey="siteKey" :data-lang="lang" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({ siteKey: String, lang: { type: String, default: "tr" } });
const emit = defineEmits(["verified"]);
const host = ref(null);

function onVerified(e) { emit("verified", e.detail); }

onMounted(() => {
  const id = "veylify-sdk";
  const mount = () => window.Veylify && window.Veylify.render(host.value);
  if (!document.getElementById(id)) {
    const s = document.createElement("script");
    s.id = id; s.src = "https://veylify.com/veylify.js"; s.async = true; s.defer = true;
    s.onload = mount;
    document.body.appendChild(s);
  } else { mount(); }
  host.value.addEventListener("veylify-verified", onVerified);
});

onBeforeUnmount(() => host.value?.removeEventListener("veylify-verified", onVerified));
</script>
```

---

## Angular

```ts
// veylify.directive.ts
import { Directive, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy } from "@angular/core";

@Directive({ selector: "[veylify]", standalone: true })
export class VeylifyDirective implements OnInit, OnDestroy {
  @Input("veylify") siteKey!: string;
  @Input() lang = "tr";
  @Output() verified = new EventEmitter<any>();

  private handler = (e: any) => this.verified.emit(e.detail);

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit() {
    const node = this.el.nativeElement;
    node.classList.add("veylify");
    node.setAttribute("data-sitekey", this.siteKey);
    node.setAttribute("data-lang", this.lang);
    node.addEventListener("veylify-verified", this.handler);

    const id = "veylify-sdk";
    const mount = () => (window as any).Veylify?.render(node);
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id; s.src = "https://veylify.com/veylify.js"; s.async = true; s.defer = true;
      s.onload = mount;
      document.body.appendChild(s);
    } else { mount(); }
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener("veylify-verified", this.handler);
  }
}
```

```html
<div [veylify]="'pk_live_xxxxxxxx'" lang="tr" (verified)="onVerified($event)"></div>
```

---

## Erişilebilirlik

Widget WCAG uyumludur:
- **Sesli okuma** — ghost-font'u göremeyenler için 🔊 butonu kodu tonlarla çalar.
- **`prefers-reduced-motion`** — hareket kapalıysa ses modu vurgulanır.
- Canvas `role="img"` + açıklayıcı `aria-label`, canlı-duyuru (`aria-live`) bölgeleri.

`data-lang` ile arayüz + erişilebilirlik metinleri dile uyarlanır (`tr` / `en`).

---

## Backend'i unutmayın

Widget yalnızca istemci tarafıdır. **Güvenlik, backend'in token'ı `/siteverify` ile teyit etmesinden gelir.** Formu işleyen sunucuda mutlaka doğrulayın:

- Node.js → [`specter-node`](./specter-node/README.md)
- Python → [`specter-python`](./specter-python/README.md)
- PHP → [`specter-php`](./specter-php/README.md)
- Ham HTTP → [`rest.md`](./rest.md)
