# MANG — İşletme Yönetim Platformu

Restoran, kafe ve KOBİ'ler için **POS + mutfak + muhasebe + CRM + etkinlik** yönetimini tek
platformda birleştiren, çok kiracılı (multi-tenant) bir SaaS uygulaması.

Tek kod tabanı; masaüstünde tam donanımlı yönetim paneli, tablette hızlı POS, telefonda
uygulama gibi çalışan PWA. Mutfak, garson ve yönetici ekranları **gerçek zamanlı** olarak
birbirini günceller.

---

## İçindekiler

- [Öne çıkanlar](#öne-çıkanlar)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [Demo hesapları](#demo-hesapları)
- [Mimari](#mimari)
- [Gerçek zamanlı mutfak–garson akışı](#gerçek-zamanlı-mutfakgarson-akışı)
- [Çevrimdışı çalışma](#çevrimdışı-çalışma)
- [Güvenlik](#güvenlik)
- [Veritabanı](#veritabanı)
- [Ortam değişkenleri](#ortam-değişkenleri)
- [Komutlar](#komutlar)
- [Test](#test)
- [Production dağıtımı](#production-dağıtımı)
- [Proje yapısı](#proje-yapısı)
- [Bilinçli sınırlar](#bilinçli-sınırlar)

---

## Öne çıkanlar

**Satış ve mutfak**
- Salon/masa planı (sürükle-bırak), masa taşıma ve birleştirme
- Adisyon: kategori, varyasyon, ekstra seçenek, mutfağa not, kur (course)
- İndirim, ikram, hesap bölme, kısmi ödeme, çoklu ödeme yöntemi, iade
- Açık hesap (veresiye) → cari borç olarak işlenir
- Gerçek zamanlı mutfak ekranı: **Yeni → Alındı → Hazırlanıyor → Hazır**
- Ürünler mutfak istasyonlarına (mutfak/bar/tatlı) otomatik yönlendirilir
- Personel yalnızca yetkili olduğu istasyonu görür **ve yönetebilir**
- Gecikme uyarısı (istasyon bazlı eşik), sesli + görsel + titreşimli bildirim
- Kasa açma/kapama ve **Z raporu** (beklenen/sayılan nakit farkı)

**Ürün, stok, reçete**
- Ürün CRUD, varyasyon, ekstra seçenek grupları, KDV oranı, hazırlık süresi
- Stok takibi, kritik seviye uyarısı, depo hareketleri (alım/fire/sayım/iade)
- **Reçete**: satışta malzemeler stoktan otomatik düşer, gerçek maliyet ve kâr marjı hesaplanır
- Alışta ağırlıklı ortalama maliyet güncellemesi; istenirse gider ve tedarikçi borcu oluşturma

**Finans ve muhasebe**
- Gelir–gider, kasa/banka hesapları, hesaplar arası virman
- Cari hesap (müşteri/tedarikçi), borç–alacak, tahsilat/ödeme
- Fatura (satış/alış), kalem bazlı iskonto ve KDV, kısmi ödeme, PDF/yazdırma
- Raporlar: satış, kâr–zarar, ürün kârlılığı, KDV özeti, nakit akışı, personel, Z raporu
- Excel (XLSX) ve CSV dışa aktarım

**CRM, planlama, etkinlik**
- Müşteri kartı: sipariş geçmişi, cari hareketler, sadakat puanı, kampanyalar
- Rezervasyon ve masa atama
- Etkinlik: bilet türleri, katılımcılar, **QR bilet + QR check-in**, görev atama, bütçe/kârlılık

**Platform**
- 7 rol (owner/admin/manager/cashier/waiter/kitchen/staff) + kişiye özel yetki istisnaları
- Çok kiracılı: işletmeler birbirinin verisine erişemez
- PWA: kurulabilir, çevrimdışı çalışır, push bildirim alır
- Komut paleti (⌘K), global arama, bildirim merkezi, klavye kısayolları
- Karanlık/aydınlık tema, iskelet yükleme, boş durumlar, mikro etkileşimler
- Tüm kritik işlemler denetim kaydına (audit log) yazılır

---

## Hızlı başlangıç

**Gereksinim:** Node.js 20.9+

```bash
npm install
cp .env.example .env
npm run setup      # migration + demo verisi
npm run dev
```

Uygulama: **http://localhost:3000**

> **Veritabanı kurmanıza gerek yok.** `npm run dev`, resmi PostgreSQL ikililerini kullanan
> gömülü bir sunucuyu `127.0.0.1:5433` üzerinde otomatik başlatır (veriler `./.data/postgres`).
> Geliştirme ve production **aynı motoru** kullanır; production'da yalnızca `.env` içindeki
> `DATABASE_URL` değişir. Şema, migration ve sorgular birebir aynıdır.
>
> Sunucuyu ayrı yönetmek isterseniz: `npm run db:start` / `npm run db:stop`.

---

## Demo hesapları

Tümünün şifresi: **`Demo1234`**

| E-posta | Rol | POS PIN | Ne görür? |
|---|---|---|---|
| `sahip@mang.demo` | İşletme Sahibi | 1234 | Her şey |
| `mudur@mang.demo` | Müdür | 2345 | Operasyon, finans, raporlar, personel |
| `kasa@mang.demo` | Kasiyer | 3456 | POS, ödeme, kasa, müşteri, fatura |
| `garson@mang.demo` | Garson | 4567 | Masa, adisyon, sipariş |
| `garson2@mang.demo` | Garson | 5678 | Masa, adisyon, sipariş |
| `mutfak@mang.demo` | Aşçıbaşı | 6789 | Mutfak ekranı — **Mutfak + Tatlı** istasyonu |
| `bar@mang.demo` | Barmen | 7890 | Mutfak ekranı — yalnızca **Bar** istasyonu |

Demo verisi: 30 günlük ~750 adisyon, 36 ürünlük menü, 30 malzeme, 33 reçete, 20 masa,
9 cari, 2 etkinlik (18 QR biletli katılımcı), rezervasyonlar, vardiyalar, giderler.

**Gerçek zamanlı akışı denemek için:** İki tarayıcı penceresi açın — birinde
`garson@mang.demo` ile `/pos`, diğerinde `mutfak@mang.demo` ile `/kitchen`. Garson
siparişi gönderdiği anda mutfakta sesli uyarıyla belirir; mutfak "Hazır" dediğinde
garsonun ekranında bildirim çıkar.

---

## Mimari

```
Next.js 15 (App Router)  ·  React 19  ·  TypeScript (strict)
Tailwind CSS v4          ·  Radix UI (shadcn/ui deseni)
Drizzle ORM              ·  PostgreSQL (dev ve production aynı motor)
SSE                      ·  Web Push (VAPID)  ·  IndexedDB kuyruk
```

**Katmanlar**

| Katman | Yol | Sorumluluk |
|---|---|---|
| Şema | `src/server/db/schema.ts` | 45+ tablo, ilişkiler, indeksler |
| Servisler | `src/server/services/*` | İş mantığı (sipariş, stok, fatura, analiz) |
| HTTP | `src/server/http/*` | Kimlik, yetki, doğrulama, hız sınırı, idempotency, audit |
| Gerçek zamanlı | `src/server/realtime/*` | Olay veriyolu, hedefleme, push |
| API | `src/app/api/**` | 90+ uç nokta |
| Arayüz | `src/components/**` | Ekranlar ve tasarım sistemi |

**Tek noktadan güvenlik.** Tüm API uçları `route()` sarmalayıcısından geçer
(`src/server/http/api.ts`): oturum doğrulama, kiracı tespiti, RBAC, zod doğrulama,
CSRF için Origin kontrolü, hız sınırı, idempotency ve hata biçimlendirme burada uygulanır.
Bir ucu yazarken bunları unutmak mümkün değildir.

**Para birimi.** Tüm parasal değerler **tam sayı ve kuruş** cinsindendir. Kayan nokta
hatası (0.1 + 0.2 problemi) yaşanmaz. Dönüşümler `src/lib/money.ts` içindedir.

**KDV.** Türkiye perakende pratiğine uygun olarak POS fiyatları **KDV dahil** girilir;
KDV brütten ayrıştırılır. Faturalarda ise matrah + KDV olarak ayrı gösterilir.

---

## Gerçek zamanlı mutfak–garson akışı

```
Garson (POS)                Sunucu                    Mutfak (KDS)
    │                          │                           │
    │  POST /orders/:id/send   │                           │
    ├─────────────────────────▶│                           │
    │                          │  order.items_sent (SSE)   │
    │                          ├──────────────────────────▶│  🔔 ses + titreşim
    │                          │                           │
    │                          │  POST /orders/items/status │
    │                          │◀──────────────────────────┤  Alındı → Hazırlanıyor
    │                          │                           │
    │                          │◀──────────────────────────┤  Hazır
    │  orderitem.status (SSE)  │                           │
    │◀─────────────────────────┤  + Web Push               │
    │  🔔 "Masa 12 — #1042 hazır"                          │
    │                          │                           │
    │  status: served          │                           │
    ├─────────────────────────▶│  Teslim aldım / edildi    │
    │                          │                           │
    │  POST /orders/:id/payments                           │
    ├─────────────────────────▶│  → masa boşalır, kasa işlenir
```

**Tasarım kararları**

- **SSE tercih edildi** (WebSocket yerine): tek yönlü sunucu→istemci akışı için yeterli,
  HTTP üzerinden çalışır, proxy/CDN uyumu daha iyi, tarayıcı otomatik yeniden bağlanır.
- **Kayıp olay yok:** her olay artan sıra numarası taşır. Bağlantı koptuğunda tarayıcı
  `Last-Event-ID` gönderir, sunucu aradaki olayları tekrar iletir.
- **Sunucuda hedefleme:** olaylar role, kullanıcıya ve istasyona göre **sunucuda** filtrelenir.
  Bar personeli mutfak siparişini görmez; ilgisiz garsona "hazır" bildirimi gitmez.
- **İstasyon kısıtı yazmada da geçerli:** görünürlük tek başına yeterli değildir; bar
  personelinin mutfak kalemini değiştirmesi sunucuda reddedilir.
- **Yatay ölçekleme:** varsayılan veriyolu süreç içidir. Birden çok sunucu için
  `attachBroker()` ile Redis Pub/Sub veya PostgreSQL `LISTEN/NOTIFY` bağlanabilir;
  olay sözleşmesi değişmez (`src/server/realtime/bus.ts`).

---

## Çevrimdışı çalışma

İnternet kesildiğinde kritik POS işlemleri **kaybolmaz**:

1. Sipariş gönderme, durum değiştirme ve ödeme istekleri **IndexedDB** kuyruğuna yazılır
   (`src/lib/offline-queue.ts`).
2. Üst çubukta "N bekliyor" rozeti görünür.
3. Bağlantı gelince (veya Background Sync tetiklenince) istekler **sırayla** gönderilir.
4. Her istek **aynı `Idempotency-Key`** ile tekrar edilir; sunucu aynı anahtarı ikinci kez
   işlemez, böylece mükerrer sipariş veya çift tahsilat oluşmaz.

Service worker ayrıca sayfaları ve statik dosyaları önbelleğe alır; çevrimdışıyken
`/offline` sayfası gösterilir.

---

## Güvenlik

| Konu | Uygulama |
|---|---|
| Şifre saklama | `scrypt` (N=32768, r=8, p=1), rastgele salt, sabit zamanlı karşılaştırma |
| Oturum | HttpOnly + SameSite=Lax cookie içinde imzalı JWT **ve** veritabanı kaydı (iptal edilebilir) |
| Kaba kuvvet | 8 hatalı denemede 15 dk hesap kilidi + uç bazlı hız sınırı |
| Yetkilendirme | Her istekte sunucuda yeniden doğrulanır; istemci kontrolü yalnızca arayüz içindir |
| Kiracı izolasyonu | Tüm sorgular `businessId` ile sınırlıdır; başka işletmenin kaydı `404` döner |
| CSRF | SameSite=Lax + mutasyonlarda Origin doğrulaması |
| XSS | React kaçışlama + sıkı Content-Security-Policy başlıkları |
| SQL injection | Drizzle parametreli sorgular; ham SQL birleştirme yok |
| Rol yükseltme | Kimse kendinden yüksek/eşit rol atayamaz; sahip rolü korunur |
| Oturum sonlandırma | Şifre değişiminde ve personel pasife alındığında tüm oturumlar iptal edilir |
| Denetim | Kritik işlemler kullanıcı, IP, tarih ve öncesi/sonrası değerlerle kaydedilir |
| Hassas veri | Audit kayıtlarında şifre/jeton alanları maskelenir |

---

## Veritabanı

45+ tablo; başlıcaları:

- **Kiracılık:** `businesses`, `users`, `memberships`, `sessions`, `audit_logs`
- **Katalog:** `products`, `product_variants`, `modifier_groups`, `modifiers`, `categories`
- **Stok:** `stock_movements`, `warehouses`, `recipes`, `recipe_items`
- **POS:** `areas`, `tables`, `orders`, `order_items`, `order_item_modifiers`, `payments`, `cash_sessions`
- **Finans:** `accounts`, `transactions`, `transaction_categories`, `invoices`, `invoice_items`, `ledger_entries`
- **CRM:** `contacts`, `loyalty_transactions`, `campaigns`, `reservations`
- **Etkinlik:** `events`, `event_ticket_types`, `event_attendees`, `event_tasks`
- **Operasyon:** `shifts`, `time_entries`, `tasks`, `notifications`, `push_subscriptions`, `idempotency_keys`, `counters`

**Geliştirme veritabanı nasıl çalışır?**

`embedded-postgres` paketi resmi PostgreSQL ikililerini indirir ve `./.data/postgres`
dizininde gerçek bir sunucu çalıştırır. Bu, gömülü/WASM bir taklit değil, PostgreSQL'in
kendisidir — dolayısıyla:

- Dev sunucusu, seed betiği ve testler **aynı anda** bağlanabilir.
- Süreç zorla kapatılsa bile (SIGKILL) PostgreSQL kendi kurtarma mekanizmasıyla açılır.
- `npm run dev` Ctrl+C ile kapatıldığında veritabanı düzgünce durdurulur.

Şema değişikliği:

```bash
# src/server/db/schema.ts dosyasını düzenleyin, sonra:
npm run db:generate   # SQL migration üretir (drizzle/)
npm run db:migrate    # uygular
```

---

## Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | production'da | PostgreSQL adresi. Geliştirmede boş bırakın; gömülü sunucu kullanılır. |
| `AUTH_SECRET` | **evet** | Oturum imzalama anahtarı, min. 32 karakter. `openssl rand -base64 48` |
| `APP_URL` | önerilir | Uygulamanın genel adresi (e-posta bağlantıları, CSRF) |
| `SESSION_TTL_SECONDS` | hayır | Oturum ömrü, varsayılan 30 gün |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | hayır | Push bildirimleri için. `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | hayır | " |
| `SMTP_URL` | hayır | Şifre sıfırlama e-postaları. Boşsa bağlantı sunucu loguna yazılır. |
| `RATE_LIMIT_ENABLED` | hayır | `false` ile kapatılabilir (yalnızca geliştirme) |

---

## Komutlar

```bash
npm run dev           # gömülü PostgreSQL + Next.js (tek komut)
npm run dev:next      # yalnızca Next.js (harici veritabanı ile)
npm run build         # production derlemesi
npm run start         # production sunucusu
npm run typecheck     # TypeScript kontrolü
npm test              # birim testler (vitest)
npm run test:e2e      # uçtan uca akış testi (dev sunucusu açıkken)

npm run setup         # generate + migrate + seed
npm run db:generate   # şemadan SQL migration üret
npm run db:migrate    # migration'ları uygula
npm run db:seed       # demo verisi yükle
npm run db:start      # gömülü PostgreSQL'i başlat (arka planda tutar)
npm run db:stop       # gömülü PostgreSQL'i düzgünce durdur
npm run db:reset      # yerel geliştirme veritabanını sil
npm run db:studio     # Drizzle Studio
```

---

## Test

**Birim testler** — para/KDV hesapları (binlik/ondalık ayracı belirsizliği dahil),
fiyatlandırma, yetkiler, şifre hash'leme, gerçek zamanlı hedefleme, yardımcılar:

```bash
npm test
```

**Uçtan uca akış testi** — çalışan sunucuya karşı gerçek HTTP + SSE ile:

```bash
npm run dev          # ayrı terminalde
npm run test:e2e     # 44 kontrol
npm run test:broker  # çok kopyalı gerçek zamanlı akış (4 kontrol)
```

Doğruladıkları:

```
✓ Kimlik doğrulama, roller, yanlış şifre reddi
✓ Garsonun finans verisine erişememesi
✓ SSE bağlantıları (garson, mutfak, yönetici)
✓ Adisyon açma + idempotency (mükerrer adisyon açılmıyor)
✓ Kalem ekleme + idempotency
✓ Mutfağa gönderim → mutfağın ANINDA alması
✓ Reçeteden malzemenin stoktan otomatik düşmesi
✓ İstasyon yönlendirmesi (mutfak/bar birbirinin ürününü görmüyor)
✓ Bar personelinin mutfak kalemine yazamaması
✓ Alındı → Hazırlanıyor → Hazır geçişleri
✓ Garsonun "hazır" bildirimini ANINDA alması (SSE + bildirim merkezi)
✓ Tüm istasyonlar bitince "sipariş tamamen hazır" olayı
✓ Teslim aldım / teslim edildi zaman damgaları
✓ Yetki sınırları (garson mutfak durumu, mutfak ödeme alamaz)
✓ Kısmi ödeme → tam ödeme → adisyon kapanışı → masanın boşalması
✓ Ödeme idempotency (çift tahsilat yok)
✓ Kasa/banka hareketlerinin oluşması
✓ Denetim kayıtlarının yazılması
✓ Çok kiracılı izolasyon (başka işletme veriyi göremiyor)
```

---

## Production dağıtımı

### Ücretsiz: kendi bilgisayarınızı sunucu yapın

Hesap, kart ve kurulum gerektirmez. Tek komut:

```bash
npm run share
```

Betik sırayla: PostgreSQL'i başlatır → migration'ları uygular → production derlemesi
yapar → HTTPS tüneli açar → dışarıdan erişilebildiğini doğrular ve adresi yazar.

```
  MANG yayinda
  https://xxxxxxxx.lhr.life
```

**Bilinmesi gerekenler**

| Konu | Durum |
|---|---|
| Ücret | Yok |
| HTTPS | Var |
| Gerçek zamanlı mutfak akışı (SSE) | **Çalışır** — test edildi |
| Adres kalıcılığı | **Yok** — her başlatmada değişir (bkz. aşağısı) |
| Çalışma süresi | Bilgisayar açık ve uyanık kaldığı sürece |
| Veritabanı | Ayrı ve boş (`mang_public`); geliştirme verinize dokunmaz |

**Adres neden her seferinde değişiyor?**

localhost.run ücretsiz planda her bağlantıda rastgele bir alt alan adı verir.
Kayıtlı bir SSH anahtarı bağlantıyı hesabınıza tanıtır (tünel kaydında
`authn: user ...@... authenticated` satırını görürsünüz) ama alt alan adını
**sabitlemez** — bu, ücretsiz planın bir sınırıdır, yapılandırma hatası değildir.

Sabit bir adres için iki yol var:

1. **Kendi alan adınızı bağlayın** — <https://admin.localhost.run/> üzerinden
   custom domain tanımlayın. Elinizde zaten bir alan adı var.
2. **Bir VPS'e kurun** — kalıcı IP, kalıcı adres, bilgisayarınız kapalıyken de
   çalışır. `Dockerfile` ve `fly.toml` hazır.

Anahtar kurulumu (bağlantıyı hesabınıza tanıtmak için, kart istemez):

```bash
# 1. Bu iş için ayrı bir anahtar üretin
ssh-keygen -t ed25519 -f ~/.ssh/mang_lhr -N "" -C "mang-localhost-run"
cat ~/.ssh/mang_lhr.pub

# 2. https://admin.localhost.run adresinde hesap açıp
#    SSH Keys bölümüne yukarıdaki satırı yapıştırın.

# 3. Hepsi bu — betik anahtarı görürse otomatik kullanır.
npm run share
```

Anahtar `~/.ssh/mang_lhr` konumundaysa betik onunla bağlanır. Başka bir konum
için: `LHR_KEY=/yol/anahtar npm run share`

**Kendi kendine toparlanma.** Betik 20 saniyede bir hem uygulamayı hem tüneli yoklar.
Uygulama düşerse yeniden başlatır; tünel koparsa yeniden kurar. Adres değişirse
uygulamayı yeni `APP_URL` ile yeniden başlatıp yeni adresi ekrana yazar.

Bilgisayarın uyumasını engellemek için (macOS):

```bash
caffeinate -i npm run share
```

Demo verisi yüklemek isterseniz ayrı bir terminalde:

```bash
DATABASE_URL="postgresql://mang:mang@127.0.0.1:5433/mang_public" npm run db:seed
```

> **Tünel seçimi neden localhost.run?** Cloudflare'in ücretsiz "quick tunnel"i
> (`trycloudflare.com`) denendi ancak yanıt gövdesini tamponluyor: SSE akışı hiç
> başlamıyor ve mutfak ekranı sipariş almıyor (10 saniyede 0 bayt ölçüldü).
> `localhost.run` bir SSH tüneli olduğu için tamponlama yapmaz.

### Fly.io (önerilen — sürekli çalışan konteyner)

Mutfak ekranı sürekli açık bir SSE bağlantısı tuttuğu için sunucusuz platformlar
yerine her zaman ayakta bir konteyner tercih edilmiştir.

```bash
# 1. CLI kurulumu ve giriş (bir kez)
curl -sL https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"
flyctl auth login

# 2. Uygulama ve veritabanı
flyctl apps create mang-pos --org personal
flyctl postgres create --name mang-pos-db --region fra \
  --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 3
flyctl postgres attach mang-pos-db --app mang-pos   # DATABASE_URL secret'ı yazar

# 3. Gizli değerler
flyctl secrets set --app mang-pos --stage \
  AUTH_SECRET="$(openssl rand -base64 48)" \
  APP_URL="https://mang-pos.fly.dev" \
  NEXT_PUBLIC_VAPID_PUBLIC_KEY="..." \
  VAPID_PRIVATE_KEY="..." \
  VAPID_SUBJECT="mailto:destek@ornek.com"
# VAPID anahtarları: npx web-push generate-vapid-keys

# 4. Dağıtım (migration'lar otomatik uygulanır)
flyctl deploy --app mang-pos
```

Hazır betik: `scripts/deploy-fly.sh` yukarıdaki adımların tamamını çalıştırır.

**`fly.toml` içindeki kritik ayarlar**

| Ayar | Neden |
|---|---|
| `auto_stop_machines = false` | Mutfak ekranı sürekli bağlantı tutar; makine uyutulmamalı |
| `min_machines_running = 1` | Soğuk başlangıçta sipariş kaçmasın |
| `release_command` | Her dağıtımda migration'lar uygulanır, uygulama başlamadan önce |
| `REALTIME_BROKER = "postgres"` | Birden fazla kopyada olaylar kopyalar arası akar |
| Yüksek eşzamanlılık eşiği | SSE bağlantıları uzun ömürlüdür, normal istek gibi sayılmamalı |

### Docker (kendi sunucunuz)

```bash
docker build -t mang .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e AUTH_SECRET="$(openssl rand -base64 48)" \
  -e APP_URL="https://panel.isletmeniz.com" \
  -e REALTIME_BROKER=postgres \
  mang
```

İmaj `output: "standalone"` kullanır (~100 MB) ve root olmayan kullanıcıyla çalışır.
Migration'ları elle uygulamak için: `docker run ... mang node ./scripts/migrate-prod.mjs`

### Ters vekil (nginx) — SSE için önemli

```nginx
location /api/realtime/stream {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_buffering off;        # SSE için zorunlu
    proxy_cache off;
    proxy_read_timeout 24h;
}
```

### Sunucusuz platformlar (Vercel vb.) hakkında not

Uygulama Vercel'de **çalışır** — çok kopyalı gerçek zamanlı akış PostgreSQL
`LISTEN/NOTIFY` broker'ı ile çözülmüştür. Ancak sunucusuz çalışma süresi sınırları
nedeniyle SSE bağlantısı düzenli aralıklarla kopar ve yeniden kurulur. Sipariş
kaybolmaz (her olay sıra numarası taşır, `Last-Event-ID` ile kaçanlar tekrar gönderilir)
ama mutfak ekranında sürekli yeniden bağlanma olur. Bu nedenle sürekli çalışan bir
konteyner önerilir.

### Ölçekleme

`REALTIME_BROKER=postgres` ile birden fazla kopya güvenlidir; olaylar PostgreSQL
`LISTEN/NOTIFY` üzerinden tüm kopyalara dağıtılır (`src/server/realtime/pg-broker.ts`).
Doğrulama: `npm run test:broker`.

Redis'e geçmek isterseniz `attachBroker()` arayüzünü uygulayan bir modül yazmanız
yeterlidir; olay sözleşmesi değişmez. Hız sınırı deposu da `setRateLimitStore()` ile
Redis'e taşınabilir.

## Proje yapısı

```
src/
├── app/
│   ├── (auth)/           giriş, kayıt, şifre sıfırlama
│   ├── (app)/            oturum gerektiren tüm ekranlar
│   ├── api/              90+ API ucu
│   ├── onboarding/       kurulum sihirbazı
│   └── session-expired/  oturum temizleme
├── components/
│   ├── ui/               tasarım sistemi (shadcn/ui deseni)
│   ├── shared/           tablo, grafik, tarih seçici, para girişi
│   ├── layout/           kabuk, menü, komut paleti, bildirimler
│   ├── realtime/         SSE sağlayıcı ve genel etkiler
│   └── <modül>/          pos, kitchen, orders, products, finance, events…
├── server/
│   ├── db/               şema + bağlantı (çift sürücü)
│   ├── auth/             şifre, oturum
│   ├── http/             api sarmalayıcı, hata, hız sınırı, audit, crud
│   ├── realtime/         olay veriyolu, hedefleme, push
│   ├── services/         iş mantığı
│   └── validation/       zod şemaları
├── lib/                  para, tarih, yetki, api istemcisi, çevrimdışı kuyruk
└── hooks/
tests/
├── unit/                 68 birim test
└── e2e/                  uçtan uca akış testi
```

---

## Menüyü toplu ekleme

Ürünler ekranındaki **Toplu ekle** düğmesi, menüyü tek tek forma girme zorunluluğunu
kaldırır. Excel'den, bir belgeden veya mesajdan kopyalanan metin doğrudan yapıştırılır.

```
Başlangıçlar          <- fiyatsız satır kategori başlığı sayılır
Humus 145             <- satır sonundaki sayı fiyattır
Haydari 125

Ana Yemekler
Adana Kebap; 465; Ana Yemekler; Mutfak    <- Ad; Fiyat; Kategori; İstasyon
Karışık Izgara; 1.250,00
```

Ayırıcı olarak `;`, sekme (Excel'den yapıştırma) veya `|` kullanılabilir. Ayrıştırma
`src/lib/product-import.ts` içinde saf bir fonksiyondur; aynı kod hem tarayıcıda anlık
önizleme için hem de sunucuda kaydetmeden önce doğrulama için çalışır — önizlemede
gördüğünüz sonuç eklenen sonuçtur.

Aynı adda ürün varsa o satır atlanır ve mevcut ürün değiştirilmez. Kategori ve istasyonlar
yalnızca gerçekten eklenen ürünler için oluşturulur, tamamı atlanan bir listede boş kategori
oluşmaz. Tek seferde en fazla 300 ürün eklenir.

---

## Bilinçli sınırlar

Dürüstlük gereği: aşağıdakiler **bağlı değildir** ve bağlıymış gibi gösterilmez.

- **e-Fatura / GİB entegrasyonu yoktur.** Faturalar işletme içi belge olarak üretilir,
  cari hesaba işlenir, PDF/yazdırma alınır. Veritabanında `eInvoiceStatus` alanı
  ayrılmıştır ve daima `not_connected` döner. Entegratör bağlandığında mevcut fatura
  kayıtları değiştirilmeden kullanılabilir. KDV raporu bilgilendirme amaçlıdır,
  resmi beyanname yerine geçmez.
- **Push bildirimleri** yalnızca VAPID anahtarları tanımlıysa çalışır. Tanımlı değilse
  Ayarlar > Entegrasyonlar ekranı bunu açıkça "bağlı değil" olarak gösterir; uygulama
  içi bildirimler ve sesli uyarılar çalışmaya devam eder.
- **E-posta gönderimi** `SMTP_URL` tanımlıysa yapılır (`npm i nodemailer` ile etkinleşir).
  Tanımlı değilse şifre sıfırlama bağlantısı sunucu loguna yazılır ve geliştirme
  ortamında ekranda gösterilir — akış her durumda çalışır.
- **QR kamera taraması** tarayıcının `BarcodeDetector` desteğine bağlıdır. Desteklenmiyorsa
  ekran bunu belirtir ve kod elle girilebilir (barkod okuyucu da çalışır).
- **Ödeme sağlayıcı entegrasyonu yoktur.** Ödemeler POS'ta kaydedilir; sanal POS bağlantısı
  ileride `payments` servisine adaptör olarak eklenebilir.
- **Haftalık raporun yapay zeka özeti isteğe bağlıdır.** Raporun sayıları ve bulguları
  her koşulda gerçek verilerden hesaplanır. Özet metnini bir dil modelinin yazması için
  `ANTHROPIC_API_KEY` tanımlanır; tanımlı değilse metin kural tabanlı üreticiyle yazılır.
  Rapor hangisinin kullanıldığını ("Yapay zeka" / "Otomatik") açıkça gösterir — bağlı
  olmayan bir yapay zeka varmış gibi sunulmaz. Sağlayıcıya yalnızca hesaplanmış özet
  değerler gider; müşteri adı, personel e-postası gibi kişisel veri gönderilmez.

---

## Lisans

Özel proje. Tüm hakları saklıdır.
