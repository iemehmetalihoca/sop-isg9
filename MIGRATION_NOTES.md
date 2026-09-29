## V4.1.2 - Personel satırı silme

- Ortak `PersonTable` bileşenine satır bazlı silme aksiyonu eklendi.
- `workers`, `personnel` ve `commissioning` listelerinde eklenen kişiler artık silinebilir.
- Liste son satıra düştüğünde silme işlemi bir boş satır bırakarak veri giriş alanını korur.


## V4.1.1 - Textarea iki yönlü autosize düzeltmesi

- İş Güvenliği Önlemleri dahil `InlineText multiline` alanları artık metin uzadıkça büyür ve metin silindikçe aynı anda küçülür.
- Modern Chrome/Edge için `field-sizing: content` kullanılır.
- Desteklemeyen tarayıcılarda eski yüksekliği sıfırlayıp güncel `scrollHeight` değerini tekrar ölçen fallback çalışır.

# V3.2 → React V4 Migration Notes

## Korunan veri alanları

Yeni V4 JSON, eski standalone dosyadaki ana kök alanları korur: `project`, `uiLang`, `activeDocument`, `labels`, `instruction`, `meta`, `lotoType`, `coverPhoto`, `ppe`, `energies`, `otherEnergy`, `safety`, `units`, `workers`, `verifier`, `equipments`, `personnel`, `points`, `steps`, `commissioning`.

Yeni editör yalnızca ek olarak `editor` alanını kullanır. Burada bölüm sırası ve zoom gibi arayüz metadata'sı tutulur.

## Eski JSON yükleme

`src/lib/schema.ts` eski V3.2 JSON'u Zod ile kabul eder, eksik alanları varsayılanlarla tamamlar ve yeni `editor` metadata'sını ekler. `action` alanında eski `Closed / Opened / Fermé / Ouvert` gibi karşılıklar tekrar `Kapatıldı / Açıldı` standardına normalize edilir.

## Render mimarisi

Eski uygulamada `form()` ve `preview()` ayrı HTML stringleri üretiyordu. V4'te aynı React component hem edit hem preview/print görünümünün kaynağıdır. Edit modunda input chrome'u görünür; Preview/Print modunda kontroller CSS ile temizlenir.

## Bilerek taşınmayan güvenlik yaklaşımı

Eski HTML'deki tarayıcı tarafı `user / 1234` kontrolü gerçek güvenlik olmadığı için V4'e taşınmadı. Production sürümünde Entra ID / SSO veya backend session eklenmelidir.

## PDF

Bu frontend paketinde A4 print CSS + `window.print()` vardır. Önerilen production PDF motoru sonraki server katmanında Playwright/Chromium olacaktır; bu ZIP'te Playwright browser dependency'si bilerek bulunmaz.

## V4.1 - İş Güvenliği Önlemleri
- Çok satırlı inline alanlar içerikle birlikte otomatik büyür; sabit textarea yüksekliği kaldırıldı.
- İş Güvenliği Önlemleri maddeleri drag & drop ile yeniden sıralanabilir.
- Her önlem satırında hızlı yukarı/aşağı taşıma butonları vardır; numaralar sıraya göre otomatik yenilenir.


## V4.1.3 - Personel silme aksiyonu UI iyileştirmesi

- `PersonTable` silme düğmesi kalıcı kırmızı kutu yerine hover/focus ile görünen ghost aksiyona dönüştürüldü.
- Dolu kişi satırlarında silme öncesi kullanıcı onayı eklendi.
- Personel aksiyon sütunu edit modunda dar, preview/print modunda tamamen gizlidir.


## V4.1.4
- Personel tablolarındaki ayrı silme/aksiyon sütunu kaldırıldı.
- Silme ikonu ilgili satırın son hücresine görsel olarak bağlı fakat tablo sınırının dışında, sağ marjda gösteriliyor.
- Preview/print/PDF görünümünde ikon görünmüyor.
- Turbopack root açıkça proje klasörüne sabitlendi; üst dizindeki ilgisiz package-lock.json uyarısını önler.

## V4.1.6
- Doğrulayan alanı, açıklama satırının hemen altında 2 satırlı / 6 hücreli kurumsal tablo düzenine geçirildi.
- İsim, Tarih/Saat, Bölüm, Telefon, Görev ve İmza alanlarının tamamı verifier verisine bağlandı.


## V4.1.8
- 5. LOTO Talimatı tablosundaki ayrı silme sütunu kaldırıldı.
- Her adımın silme ikonu, diğer düzenlenebilir tablolardaki standartla aynı şekilde tablonun sağında dışarıda gösterilir.
- Silme ikonu Önizleme/Yazdır/PDF görünümünde gizlidir.

## V4.1.9
- 2. Kullanılacak LOTO Ekipmanları satırları kendi içinde drag & drop ile sıralanabilir.
- 4. LOTO Noktaları satırları kendi içinde drag & drop ile sıralanabilir.
- 5. LOTO Talimatı adımları kendi içinde drag & drop ile sıralanabilir; çok sayfalı talimatlarda aynı sıralama grubu korunur.
- Sıralama tutamacı ayrı tablo sütunu açmaz; No / Adım hücresinin içinde görünür.
- Sıralama sonrası no/adım değerleri otomatik yeniden numaralanır.
- Tutamaçlar Preview / Print / PDF görünümünde gizlenir.

## V4.1.13 — Fotoğraf resize kontrol erişilebilirliği
- Kilitleme/Etiketleme Talimatı fotoğrafı 8 mm'ye küçültülse bile resize slider'ı artık fotoğraf kartının genişliğine sıkışmaz.
- Edit modunda resize kontrolü 46 mm sabit kullanılabilir genişlikte tutulur.
- Fotoğraf yüksekliği aralığı 8–70 mm'ye genişletildi (önceki üst sınır 35 mm idi).
- Canlı önizleme ve final boyut aynı geometri hesabını kullanmaya devam eder.

## V4.1.14 — Çoklu fotoğraf editör yerleşimi
- Kilitleme noktası fotoğraflarında editör kontrol alanı fotoğrafın fiziksel A4 boyutundan ayrıldı.
- Her fotoğraf edit modunda en az 52 mm bağımsız çalışma alanı ayırır; slider, mm değeri ve silme aksiyonu komşu karta taşmaz.
- Birden fazla fotoğraf yan yana sığmadığında galeri otomatik olarak alt satıra geçer.
- Küçük fotoğraflardaki Değiştir/Sil hover aksiyonları kendi editör kartı içinde merkezlenir.
- Preview/print modunda editör için ayrılan ekstra alan kaldırılır; yalnız gerçek A4 fotoğraf geometrisi kullanılır.

## v4.1.15 — Direct image resize handles
- Removed photo resize sliders and fixed editor footprints from the Lockout/Tagout Instruction photo gallery.
- Photos now resize directly from 8 on-canvas handles.
- Corner handles preserve the current aspect ratio.
- Left/right handles resize width only; top/bottom handles resize height only.
- Per-photo `displayWidthMm` and `displayHeightMm` are stored while legacy `sizeMm` remains synchronized for backward compatibility.
- Old JSON files without the new dimensions derive their first size from the existing `sizeMm` / photo layout and natural image aspect ratio.

## V4.2.0 — Talimat fotoğraf çalışma alanı + çakışma koruması + kırpma
- KİLİTLEME / ETİKETLEME TALİMATI fotoğraf galerisi flex akışından çıkarıldı; 194 × 78 mm sabit çalışma alanına geçirildi.
- Her fotoğraf için bağımsız `xMm`, `yMm`, `displayWidthMm`, `displayHeightMm` saklanır. Küçülen fotoğraf görünmez bir kart genişliği rezerve etmez.
- Fotoğraflar sürüklenebilir, kenar/köşelerden yeniden boyutlandırılabilir, çalışma alanı dışına çıkamaz ve birbirlerinin üzerine bindirilemez.
- Kenar ve komşu fotoğraf hizalarında hafif snap uygulanır.
- `•••` menüsüne Değiştir / Kırp / Kopyala / Yapıştır / Sil eklendi. Kopyalanan fotoğraf uygun ilk boş alana çoğaltılır.
- Dosya Gezgini/Finder’dan çalışma alanına doğrudan görsel bırakılabilir.
- Kırpma non-destructive çalışır: `cropEnabled`, `cropZoom`, `cropXPct`, `cropYPct` JSON’a kaydedilir; orijinal görsel korunur.
- Eski JSON’larda X/Y bilgisi yoksa mevcut fotoğraflar ilk açılışta otomatik, çakışmasız konumlara yerleştirilir.
- Önizleme ve yazdırma aynı mm tabanlı geometriden render edilir; editör kontrolleri çıktıda gizlenir.

## V4.2.2 — Crop kenar tutamaçları
- V4.2.1'deki dört köşe crop tutamacına üst, alt, sol ve sağ kenar tutamaçları eklendi.
- Tek kenar tutamacı yalnız ilgili ekseni değiştirir; köşeler iki ekseni birlikte değiştirir.
- Crop veri formatı değişmedi; mevcut V4.2.1 JSON'larıyla geriye dönük uyumluluk korunur.

## V4.2.5 – Yetkili Çalışanlar
- `workers` veri modeli değiştirilmedi; mevcut `name`, `date`, `time`, `department`, `phone`, `signature` alanları yeni 2 satırlı forma bağlandı.
- Eski `duty` verisi silinmez; `date` boş olduğunda yalnız görünümde geriye dönük uyumluluk amacıyla tarih hücresinde fallback olarak gösterilir.
## V4.2.10 - Talimat üst bilgi düzeni
- KİLİTLEME / ETİKETLEME TALİMATI üst bilgisinde `Tesis / Bölüm` ve `Konum` aynı üst satıra alındı.
- `Ekipman` alanı hemen altta tam genişlikte korunarak mevcut verilerle uyumluluk sürdürüldü.
- `Talimat No`, `Revizyon No / Tarihi` ve `Yayın Tarihi` tek ortak belge bilgi çerçevesinde toplandı.
- Veri modeli değiştirilmedi; eski JSON kayıtlarıyla geriye dönük uyumluluk korunur.


## V4.2.11
- KİLİTLEME / ETİKETLEME TALİMATI üst bilgilerinde eski Ekipman satırı kaldırıldı.
- Aynı satır Talimatın Uygulanacağı İşler alanına dönüştürüldü ve mevcut workScope verisine bağlandı.
- Alttaki yinelenen Talimatın Uygulanacağı İşler başlığı + input bölümü kaldırıldı.


## V4.2.12
- KİLİTLEME / ETİKETLEME TALİMATI üst bilgisindeki “Talimatın Uygulanacağı İşler” etiketi tek satıra alındı.
- Etiket sütunu 48 mm yapıldı ve sağındaki değer alanı tek satırlık input olarak düzenlendi.


## V4.2.14
- 5. LOTO Talimatı fotoğraf kırpma eklemesinde EquipmentPhotoCell içine yanlışlıkla giren crop useEffect kaldırıldı.
- React PointerEvent tipi explicit import edildi.
- Sayfanın `cropEditing is not defined` nedeniyle açılmaması giderildi.


## V4.2.15
- 5. LOTO Talimatı fotoğraf kırpmasına KİLİTLEME / ETİKETLEME TALİMATI ile aynı Orijinal geri dönüş davranışı eklendi.
- Step.originalPhoto ile ilk kırpılmamış kaynak saklanır; Orijinal ile geri yüklenir.
- Kopyala/yapıştır ve satırlar arası fotoğraf takası originalPhoto bilgisini de taşır.


## V4.2.16
- 2. Kullanılacak LOTO Ekipmanları > Ekipman Fotoğrafı, 5. LOTO Talimatı > Fotoğraf ile aynı özellik setine getirildi.
- Ekipman fotoğraflarına 8 tutamaçlı kırpma, Orijinal / İptal / Uygula akışı ve orijinal kaynak saklama eklendi.
- Kopyala/yapıştır ve satırlar arası fotoğraf taşıma, görünür fotoğrafla birlikte originalPhoto verisini de taşır.
- Değiştir/Sil işlemleri originalPhoto durumunu sıfırlar; eski dosyalar originalPhoto olmadan uyumlu açılır.

## V4.2.20
- LOTO SOP sayfa düzeyi yeniden sıralama kaldırıldı.
- SOP sayfaları sabit sırada render edilir; sürükleme/yukarı-aşağı araç çubuğu yoktur.
- Eski dosyalardaki özelleştirilmiş sopSectionOrder değeri içe aktarımda varsayılan sabit sıraya normalize edilir.

## V4.2.21 — Talimat üst bilgi ve imza tabloları tek çerçeve
- KİLİTLEME / ETİKETLEME TALİMATI üst bilgi alanı tek tabloya birleştirildi.
- Tesis/Bölüm, Konum, Talimatın Uygulanacağı İşler ile Talimat No, Revizyon No/Tarihi ve Yayın Tarihi aynı dış tabloyu paylaşır.
- Talimatın Uygulanacağı İşler etiketi tek satıra sığacak şekilde genişletildi; Konum ve iş kapsamı değer alanları yatayda genişletildi.
- Hazırlayan / Doğrulayan / Onaylayan tek 6-sütunlu tabloda ortak Adı Soyadı ve Görevi satırlarına dönüştürüldü; AutoGrow bir hücreyi yükselttiğinde aynı satırdaki diğer imza blokları da aynı yüksekliği paylaşır.

## V4.2.22 — PDF / Yazdır tutarlılık düzeltmeleri
- Tüm belge için `-webkit-print-color-adjust: exact` / `print-color-adjust: exact` zorlandı.
- Kritik renkli alanlara baskı fallback'i olarak inset shadow eklendi: talimat mavi/sarı özet başlıkları, kırmızı kilitleme alanı, yeşil kaldırma/imza başlıkları, gri üst bilgi ve kilitleme noktası başlıkları, LOTO SOP KKD/enerji seçimleri ve checkbox işaretleri.
- Baskıda `.inline-field` padding/border geometrisinin sıfırlanması kaldırıldı; önizleme ile metin hizası daha tutarlı hale getirildi.
- Edit hover/focus izlerinin baskıya taşınmaması garanti edildi.
- Tablo satırları, kilitleme özeti, kaldırma bloğu ve imza satırlarında `break-inside: avoid` eklendi.

## V4.2.28 — JSON veri bütünlüğü hardening
- SOP `meta.revision` artık JSON export sırasında otomatik RevXX ile ezilmez.
- Boş diziler importta varsayılan satırlara dönüşmez; boş durum birebir korunur.
- `instruction.pointCount` boş string olarak kaydedildiyse boş kalır.
- `steps[].authorized / approver / verifier` importta korunur.
- Legacy `coverPhotoScale` değeri importta veri alanı olarak değiştirilmez.
- `replaceDocument` import/hydration metadata'sını (`lastModified`) yeniden yazmaz.
- Okunamayan IndexedDB taslağı artık otomatik silinmez.
- Büyük fotoğraflı JSON indirmesinde Blob URL gecikmeli revoke edilir.
- JSON export öncesi serialize → parse → normalize round-trip doğrulaması zorunlu hale getirildi; ilk farklı veri yolunda export durdurulur.
- Ayrıntılı kapsam ve test notları `PERSISTENCE_AUDIT.md` dosyasındadır.

### V4.2.29
- `docx` tabanlı düzenlenebilir Word export eklendi.
- Araç çubuğuna `Word İndir` eklendi.
- LOTO SOP tüm sabit sayfaları + KİLİTLEME / ETİKETLEME TALİMATI tek `.docx` içinde A4 olarak üretilir.
- Gerçek Word tablo/metin yapısı kullanılır; tablo fotoğrafları bağımsız görsellerdir.
- Kapak ve Instruction serbest fotoğraf çalışma alanları mevcut kırpılmış fotoğrafları ve geometriyi korumak için kompozit PNG olarak aktarılır.
## v4.2.37
- LOTO Standart Operasyon Prosedürü bölümünde Basit LOTO ve Kompleks LOTO seçeneklerinin eski açıklamalı uzun metinleri geri getirildi.
- Word çıktısında da seçilen LOTO tipi uzun açıklamasıyla yazdırılır.
- Geliştirme portu 5174 olarak korunmuştur.


## v4.2.38
- LOTO SOP genel sayfasındaki KKD ve enerji tipi sembolleri legacy v3.2'deki varsayılan pictogramlardan geri getirildi.
- Özel yüklenmiş ikon varsa öncelik onda; yoksa varsayılan offline ikon otomatik kullanılır.
- Word çıktısında seçili KKD ve enerji tipleri için aynı semboller gösterilir.
- Geliştirme ve start portu 5174 olarak korunur.

## v4.2.39
- PPE, uyarı levhası ve enerji simgeleri tek kaynağa indirildi: `public/icons/`.
- Tüm simgeler kullanıcı tarafından verilen zipten temiz ve standart dosya adlarıyla yeniden yerleştirildi.
- `src/lib/default-icons.ts` artık yalnızca bu yeni katalogdan beslenir; legacy/base64 ikonlara dönüş yoktur.
- Basınca dayanıklı tulum uyarı simgesi, zip içindeki Word dosyasından çıkarılan gömülü görsel olarak eklendi.
- `Enerji kaynakları` klasöründeki `J6595.png`, mevcut uygulamadaki `Gıda Sınıfı Sıvı` seçeneğine en yakın görsel olarak eşlendi.
## v4.2.40
- Simge görünmeme sorunu giderildi: simgeler artık `src/assets/safety-icons/` içinden statik import ile bundle edilir; `/public` kök yoluna bağımlı değildir.
- Arayüz ve Word dışa aktarımı aynı tek simge kataloğunu kullanır.
- Word eşleştirmesi düzeltildi: Kimyasal Eldiven = koruyucu eldiven + aşındırıcı madde uyarısı.
- Eski proje/legacy simge kaynağı tamamen kaldırıldı.
- İçe aktarılan eski `icon`, `warningIcon`, `blueIcon` alanları runtime kaynağı olarak kullanılmaz; normalize edilirken atılır.
- Port 5174 olarak korunmuştur.
## v4.2.41
- KİLİTLEME / ETİKETLEME TALİMATI üst bilgisi artık SOP üst bilgisinden bağımsız düzenlenir.
- Üst araç çubuğuna `SOP → Talimat Aktar` eklendi. Bu işlem SOP üst bilgisini, seçili KKD simgelerini ve bunlara bağlı tehlike uyarı simgelerini tek seferlik kopyalar; canlı senkronizasyon yapmaz.
- Aktarımdan sonra Talimat üst bilgisi ve simgeleri bağımsız değiştirilebilir.
- Talimat içindeki `KULLANILMASI GEREKEN KKD` ve `TEHLİKELER` hücreleri artık yalnızca pictogram gösterir; metin alanları kaldırıldı.
- Talimat simgeleri hücre içindeki `+` seçicisinden eklenip çıkarılabilir; önizleme/yazdırmada yalnızca simgeler görünür.
- Aynı pictogram birden çok seçili SOP maddesinden geliyorsa aktarım sırasında tekilleştirilir.
- Word çıktısında Talimat üst bilgisi bağımsız Talimat verisini, KKD/Tehlike alanları da yalnızca seçili simgeleri kullanır.
- Port 5174 olarak korunur.

## v4.2.42
- Talimat KKD/tehlike simge seçicileri artık hücre dışındaki herhangi bir yere tıklanınca kapanır.
- ESC tuşu da açık simge seçiciyi kapatır.
- Açma düğmesi kapalıyken `+`, açıkken `×` gösterir; böylece aynı düğmenin kapatma işlevi kullanıcı için görünür hale gelir.
- Açık durum için görsel vurgu ve erişilebilir `aria-expanded`/etiket bilgileri eklendi.
## v4.2.43
- KİLİTLEME / ETİKETLEME TALİMATI > Enerji Kaynağı hücresi serbest metin yerine enerji etiketi seçici + manuel numara alanına dönüştürüldü.
- Kullanılabilir etiketler: GL, S, E, G, P, C, W, T, V. Numara kısmı kullanıcı tarafından elle girilir (örn. E1, E2, GL3).
- Kullanıcının gönderdiği 9 enerji etiketi görseli 2x yüksek çözünürlüklü PNG çalışma kopyaları olarak `src/assets/energy-source-tags/` içine gömüldü.
- Seçim penceresi ekranın başka yerine tıklayınca veya Esc ile kapanır; seçimden sonra numara alanına odaklanır.
- Word çıktısında Enerji Kaynağı sütunu seçilen enerji etiketi görselini ve manuel numarayı aynı görsel üzerinde üretir.
- Eski projelerdeki `energySource` metinleri E1 / GL2 benzeri biçimdeyse yeni alanlara otomatik ayrıştırılır.
- Word SOP üst bilgi exportunda önceki sürümden kalan `ins.meta` referansı `document.meta` olarak düzeltildi.
- Geliştirme/start portu 5174 olarak korunur.

## v4.2.44
- Talimat bölümündeki Enerji Kaynağı hücresi artık etiketi dinamik olarak resmin üzerine işler; ör. `S-` görselinin sağındaki sayı gerçek görselin içine yazılır.
- Arayüz önizlemesi ve Word çıktısı aynı dinamik etiket mantığını kullanır.
- Enerji etiketi önizleme boyutu büyütildi; numara daha okunur hale getirildi.

## v4.2.45
- Talimat bölümündeki Enerji Kaynağı girişi yeniden düzenlendi: sayı alanı artık ayrı kutuda değil, doğrudan etiket görselinin içine yerleşik overlay input olarak girilir.
- Ekranda kullanıcı `2` yazdığında görsel `GL-2` / `S-2` gibi tek parça görünür.
- Yazdırma ve Word çıktısında yine birleştirilmiş dinamik görsel kullanılır.

## v4.2.46
- Enerji Kaynağı etiketlerinde rakam konumu ve boyutu kod bazında ayarlandı; özellikle `G`, `V` gibi kısa etiketlerde sayı artık daha yakın ve daha dengeli görünür.
- Ekrandaki overlay input ortalı, eş boyutlu ve tabular numeric olarak güncellendi.
- Word çıktısındaki dinamik enerji etiketi üretimi de aynı hizalama kurallarını kullanır.

## v4.2.47
- Enerji etiketi numara inputu düzenleme modunda hover/focus sırasında görünür çerçeve ve hafif beyaz arka plan gösterir; kullanıcı giriş alanının yerini net görür.
- Önizleme ve yazdırma/Word çıktısında input çerçevesi görünmez; yalnızca birleşik enerji etiketi görseli kalır.

## v4.2.48
- Enerji Kaynağı içindeki sayı inputu, açık renk (özellikle beyaz) rakamlarda görünürlük kaybı yaşamaması için dinamik odak/hover arka planı ile güncellendi.
- Beyaz rakamlı etiketlerde input aktifken koyu yarı saydam zemin ve açık kenarlık kullanılır; önizleme ve yazdırmada bu yardımcı çerçeve görünmez.

## v4.2.49
- Basit LOTO / Kompleks LOTO bloğunun yatay iç marjı kaldırılarak metinler sayfanın içerik sol sınırına alındı.
- İki LOTO açıklaması da tek satırda kalacak şekilde `white-space: nowrap` uygulandı; checkbox-yazı aralığı sıkılaştırıldı.
- Port 5174 olarak korunur.

## v4.2.52
- Bu sürüm kullanıcının çalışan `v4.2.49-LOTO-TYPES-LEFT` paketi baz alınarak hazırlandı.
- KİLİTLEME / ETİKETLEME TALİMATI fotoğraf çalışma alanının minimum yüksekliği 78 mm'den 39 mm'ye indirildi.
- Fotoğraf alanı artık içerik yüksekliğine göre otomatik büyür ve küçülür; fotoğraf büyütüldüğünde veya aşağı taşındığında alt sınır canlı olarak aşağı iner.
- Fotoğraflar küçültülür, yukarı taşınır veya silinirse alan tekrar 39 mm minimuma doğru toparlanır.
- Yeni fotoğraf / yapıştırma işlemi mevcut alana sığmıyorsa çalışma alanı otomatik olarak aşağı doğru genişleyerek boş yer arar.
- Word çıktısındaki fotoğraf kompozit alanı da aynı dinamik yükseklik hesabını kullanır.

## v4.2.53
- KİLİTLEME / ETİKETLEME TALİMATI fotoğraf çalışma alanının minimum yüksekliği 39 mm’den 30 mm’ye indirildi.
- Arayüz, kayıt şeması ve Word çıktısı aynı 30 mm minimum yüksekliği kullanır.
