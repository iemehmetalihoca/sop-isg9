# JSON Veri Bütünlüğü Denetimi — V4.2.28

Bu denetim, uygulamadaki kullanıcı verisinin şu zincirde kayıpsız kalmasını hedefler:

UI / Store → JSON stringify → dosya → JSON parse → import schema → normalize → UI / Store

## Kapsam

### LOTO SOP — 1. sayfa
- Ekipman, Lokasyon, İş Tanımı
- Yayınlanma Tarihi, Revizyon, LOTO SOP No, Referans LOTO Talimat No
- Basit / Kompleks LOTO seçimleri
- Kapak fotoğrafı: görünür fotoğraf, orijinal fotoğraf, X/Y konumu, genişlik, yükseklik, legacy scale
- KKD seçenekleri ve işaret durumları
- Enerji seçenekleri ve işaret durumları
- Diğer enerji metni

### İş Güvenliği / 1. Yetkilendirilmiş Personel
- İş güvenliği önlemlerinin metni ve satır sırası
- Üretim / Bakım / Müteahhit Firma seçimleri
- Yetkili çalışanların tüm Person alanları: isim, telefon, tarih, saat, bölüm, görev, imza
- Doğrulayan kişinin tüm Person alanları

### 2. Kullanılacak LOTO Ekipmanları
- Satır sırası
- Ekipman numarası, isim, adet
- Görünür/kırpılmış fotoğraf
- Kırpma öncesi orijinal fotoğraf

### 3. Çalışacak Personel Listesi
- Satır sırası
- Person modelindeki isim, telefon, tarih, saat, bölüm, görev, imza alanlarının tamamı

### 4. LOTO Noktaları
- Satır sırası
- Kilitleme noktası, ekipman tipi, kullanılan LOTO ekipmanı, işlem, yetkili personel

### 5. LOTO Talimatı
- Satır sırası
- Açıklama
- Görünür/kırpılmış fotoğraf ve orijinal fotoğraf
- Step modelindeki authorized / approver / verifier alanları da korunur (UI'de şu an doğrudan düzenlenmeseler bile importta silinmez)

### 6. Devreye Alma
- Person modelindeki isim, telefon, tarih, saat, bölüm, görev, imza alanlarının tamamı

### KİLİTLEME / ETİKETLEME TALİMATI
- Üst meta: Tesis/Bölüm, Ekipman, Konum, uygulanacak işler, yayın tarihi, revizyon no/tarihi, talimat no
- KKD ve tehlike özetleri
- Kilitleme noktası sayısı (bilerek boş bırakılması dahil)
- Fotoğraf çalışma alanı yüksekliği ve varsayılan fotoğraf yüksekliği
- Her fotoğraf için: id, görünür/kırpılmış src, originalSrc, doğal width/height, sizeMm, displayWidthMm, displayHeightMm, offsetXMm/Ymm, alignment, xMm/yMm, cropEnabled, cropZoom, cropX/Y yüzdeleri
- Fotoğraf dizisi/sırası
- Kilitleme noktası tablosunun tüm alanları ve satır sırası
- Hazırlayan / Doğrulayan / Onaylayan ad ve görev alanları

### Genel proje durumu
- Dil
- Aktif doküman
- Label sözlüğü
- Zoom
- SOP sabit sayfa sırası
- Instruction section order legacy verisi
- Project metadata

## Bulunan ve giderilen kritik açıklar

1. JSON export sırasında `meta.revision` otomatik `RevXX` ile değiştiriliyordu. Kaldırıldı; kullanıcı girdisi artık aynen korunuyor.
2. Bazı diziler `[]` olarak kaydedildiğinde importta varsayılan satırlara dönüyordu. `safety`, `workers`, `equipments`, `personnel`, `points`, `steps`, `commissioning`, `instruction.points` artık boş dizi durumunu da birebir koruyor.
3. `instruction.pointCount = ""` importta `"3"` oluyordu. Bilerek boş bırakılan değer artık korunuyor.
4. `steps[].authorized`, `approver`, `verifier` importta zorla boşaltılıyordu. Artık korunuyor.
5. Legacy `coverPhotoScale` küçük değerlerde import clamp'i nedeniyle değişebiliyordu. Artık veri alanı olarak aynen korunuyor; geometri kaynağı X/Y/width/height alanlarıdır.
6. JSON/import/hydration sonrası `lastModified` gereksiz yere yeniden yazılıyordu. `replaceDocument` artık import edilen metadata'yı değiştirmiyor.
7. Okunamayan yerel IndexedDB taslağı otomatik siliniyordu. Artık otomatik silme yok; veri güvenlik için yerelde korunuyor.
8. Büyük fotoğraflı JSON indirmelerinde Blob URL hemen revoke ediliyordu. İndirme linki DOM'a eklenip tıklanıyor ve Blob URL gecikmeli revoke ediliyor.
9. JSON indirmeden önce otomatik round-trip kontrolü eklendi: JSON stringify → parse → normalize sonrası ilk farklı alan bulunursa export durdurulur ve kullanıcıya veri yolu bildirilir.

## Bilerek JSON'a yazılmayan geçici editör durumları

Bunlar belge verisi değildir ve başka bilgisayarda sürdürülmesi amaçlanmaz:
- açık 3-nokta menüsü
- seçili fotoğraf / seçili bölüm
- fotoğraf kopyala-yapıştır geçici panosu
- Undo/Redo geçmişi
- Edit / Preview modu
- henüz `Uygula` denmemiş kırpma taslağı
- pointer sürükleme sırasında henüz bırakılmamış geçici geometri

Kırpma `Uygula` ile tamamlandığında görünür sonuç ve orijinal kaynak JSON'a girer. Fotoğraf taşıma/boyutlandırma pointer bırakıldığında geometri JSON state'ine commit edilir.

## Taşınabilirlik notu

Fotoğraflar dosya yolu veya Blob URL olarak değil Data URL olarak dokümanın içinde saklanır. Bu nedenle JSON tek başına fotoğraf verisini taşır. Aynı V4.2.28 proje paketi (veya bu veri alanlarını destekleyen daha yeni sürüm) diğer bilgisayarda kullanılmalıdır. Eski proje sürümleri yeni kapak-fotoğrafı geometri alanlarını bilmeyebilir.
