# LOTO SOP Management · React Document Editor V4

Bu proje, `index(20260908-112732)(1).html` içindeki standalone LOTO/SOP uygulamasının React + TypeScript tabanlı yeni editör mimarisidir.

## Bu ilk React sürümünde hazır olanlar

- Next.js + React 19 + TypeScript mimarisi
- Sol editör paneli kaldırıldı: alanlar doğrudan A4 üzerinde düzenlenir
- LOTO SOP ve Kilitleme/Etiketleme Talimatı sekmeleri
- dnd-kit ile ana bölümleri sürükleyip aşağı/yukarı sıralama
- Bölüm seçimi + yukarı/aşağı hızlı taşıma
- Ctrl+Z / Ctrl+Y undo-redo
- Alt+↑ / Alt+↓ seçili bölüm taşıma
- 50%–140% belge zoom
- Edit / Preview modu
- JSON içe/dışa aktarma
- Eski V3.2 JSON yapısını normalize ederek açma
- V4 JSON içinde eski kök alanları koruma (legacy uygulama ana veriyi okuyabilir; `editor` alanını görmezden gelir)
- IndexedDB + Dexie ile otomatik yerel taslak kaydı
- Fotoğraf yükleme ve tarayıcıda yeniden boyutlandırma
- A4 print CSS ve tarayıcı üzerinden PDF/Yazdır
- Eski tek HTML dosyası `legacy/index-v3.2.html` altında referans olarak korunur

## Çalıştırma

```powershell
npm install
npm run dev
```

Tarayıcı: `http://localhost:3000`

Build:

```powershell
npm run build
```

## Mimari

- `src/store/editor-store.ts`: Zustand + Immer document state / history
- `src/lib/schema.ts`: Zod tabanlı eski JSON importer / normalizer
- `src/lib/db.ts`: Dexie / IndexedDB autosave
- `src/components/editor/DocumentCanvas.tsx`: dnd-kit document canvas
- `src/components/fields/InlineField.tsx`: A4 üstü input/image alanları
- `src/components/sections/`: SOP ve Talimat blokları
- `src/styles/document.css`: A4 / print görünümü

## Sonraki production katmanı

Bu V4 paket, frontend editör motorunun ilk gerçek sürümüdür. Kurumsal production için sıradaki katmanlar:

1. Microsoft Entra ID / gerçek backend session
2. PostgreSQL doküman + revizyon geçmişi
3. Object storage fotoğraf saklama (base64 yerine)
4. Playwright/Chromium server-side yüksek kalite PDF endpoint
5. Onay akışı (Draft → Review → Approved → Archived)
6. Yetki rolleri (Viewer / Editor / Approver / Admin)
7. Visual regression testleri ve PDF snapshot testleri

## Not

Eski HTML uygulamasındaki tarayıcı tarafı `user / 1234` girişi bu React sürümüne taşınmadı; gerçek güvenlik olmadığı için bilerek kaldırıldı. Production kimlik doğrulaması backend/SSO ile eklenmelidir.

## V4.1 – İş Güvenliği Önlemleri

- İş Güvenliği Önlemleri içindeki çok satırlı alanlar artık yazı uzadıkça otomatik olarak dikey büyür; sabit textarea yüksekliği ve iç scrollbar kullanılmaz.
- Önlem maddeleri kendi içlerinde drag & drop ile sıralanabilir.
- Her madde için hızlı yukarı/aşağı taşıma kontrolleri vardır.
- Sıra değiştiğinde 1, 2, 3... numaraları otomatik olarak yeni sıraya göre güncellenir.
- Önlem sürükleme işlemi ana SOP bölüm sürüklemesinden bağımsızdır.

## V4.1.2 – Personel satırı silme

- Yetkili Çalışanlar tablosundaki her kişi satırına düzenleme modunda Sil düğmesi eklendi.
- Aynı ortak PersonTable bileşenini kullanan Çalışacak Personel Listesi ve Devreye Alma Kişileri de aynı silme davranışını kullanır.
- Son kişi silinirse tablo tamamen yok olmaz; yeni veri girişi için bir boş kişi satırı bırakılır.
- Silme sütunu Preview/Print/PDF görünümünde gösterilmez.


## V4.1.3 – Profesyonel personel satır aksiyonu

- Personel tablolarındaki sürekli görünen kırmızı silme kutuları kaldırıldı.
- Silme aksiyonu artık satır hover/focus durumunda beliren sade `ghost` ikon olarak çalışır.
- Aksiyon sütunu 9 mm'ye daraltıldı; tabloyu gereksiz genişletmez.
- İkon normalde nötr gri, yalnız hover/focus durumunda kırmızı uyarı rengine geçer.
- Dolu bir kişi satırı silinirken yanlış silmeyi önlemek için onay istenir; boş satır doğrudan silinir.
- Preview, Print ve PDF görünümünde aksiyon sütunu tamamen gizlenir.

## V4.2.2 — 8 tutamaçlı doğrudan kırpma

- Fotoğraf üzerindeki doğrudan kırpma sistemi 4 köşeden **4 kenar + 4 köşe** olmak üzere 8 tutamaca çıkarıldı.
- Üst/alt kenar yalnız dikey kırpma yapar; sol/sağ kenar yalnız yatay kırpma yapar.
- Köşe tutamaçları iki ekseni aynı anda kırpmaya devam eder.
- Kenar tutamaçları daha uzun ve kolay tutulabilir biçimde tasarlandı; anlık karartma, 3×3 grid, Uygula / İptal / Orijinal akışı korunur.

## V4.2.5 – Yetkili Çalışanlar form düzeni

- `1. LOTO Yapacak Yetkilendirilmiş Personel Birimi` içindeki `Yetkili Çalışanlar` alanı 2 satır / 6 hücreli kurumsal forma dönüştürüldü.
- Alanlar: `İsim`, `Tarih`, `Bölüm` / `Telefon`, `Saat`, `İmza`.
- Çoklu kişi ekleme ve tablo dışı silme aksiyonu korunur.
- Eski sürümlerde `Görev / Tarih` alanına yazılmış içerik, tarih alanı boşsa veri kaybını önlemek için `Tarih` alanında gösterilir.

## V4.2.29 — Düzenlenebilir Word (.docx) dışa aktarma

Üst araç çubuğuna **Word İndir** seçeneği eklendi. Word çıktısı ekran görüntüsü değildir: metinler gerçek Word metni, tablolar gerçek Word tablosu, ekipman/adım fotoğrafları gerçek Word görselidir. KİLİTLEME / ETİKETLEME TALİMATI ve LOTO SOP aynı `.docx` içinde A4 sayfalar olarak oluşturulur. Serbest konumlandırılmış fotoğraf çalışma alanları, uygulamadaki geometriyi korumak için yüksek çözünürlüklü kompozit görsel olarak Word'e aktarılır.

Word üretimi tarayıcıda `docx` kütüphanesi ile yapılır. Proje ilk kez kurulduğunda normal `npm install` komutu `docx` bağımlılığını da yükler.
