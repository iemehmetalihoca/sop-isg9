# V4.2.29 Word Export Audit

## Amaç
LOTO SOP ve KİLİTLEME / ETİKETLEME TALİMATI verilerini düzenlenebilir `.docx` olarak dışa aktarmak ve ekrandaki A4 yapısına mümkün olduğunca yakın tutmak.

## Kullanılan motor
- `docx` 9.7.1
- Tarayıcı tarafında `Packer.toBlob()`
- Word export kodu dinamik import ile yalnız `Word İndir` tıklandığında yüklenir.

## LOTO SOP kapsamı
- Genel bilgiler
- Basit / Kompleks LOTO seçimleri
- Kapak fotoğrafı (mevcut kırpılmış görüntü + X/Y + boyut geometrisi korunur)
- KKD seçimleri
- Enerji seçimleri + Diğer
- İş Güvenliği Önlemleri
- 1. Yetkilendirilmiş Personel Birimi
- Yetkili Çalışanlar
- Doğrulayan
- 2. Kullanılacak LOTO Ekipmanları + fotoğraflar
- 3. Çalışacak Personel Listesi
- 4. LOTO Noktaları
- 5. LOTO Talimatı + fotoğraflar + yetkili/onaylayan/doğrulayan verileri
- 6. Devreye Alma + personel tablosu

## KİLİTLEME / ETİKETLEME TALİMATI kapsamı
- Tesis / Bölüm
- Konum
- Talimatın Uygulanacağı İşler
- Talimat No
- Revizyon No / Tarihi
- Yayın Tarihi
- Kullanılması Gereken KKD
- Tehlikeler
- Kilitleme Noktası
- Kilitleme Adımları
- Serbest fotoğraf çalışma alanı
- Kilitleme noktaları tablosu
- Kilit ve Etiketlerin Kaldırılması
- Hazırlayan / Doğrulayan / Onaylayan

## Fotoğraf stratejisi
- Ekipman ve LOTO Talimatı tablo fotoğrafları bağımsız `ImageRun` nesneleridir.
- Kapak ve Instruction serbest fotoğraf çalışma alanlarında koordinat/ölçü kaymasını önlemek için çalışma alanı tarayıcı Canvas'ında yüksek çözünürlükte kompozit edilir ve tek `ImageRun` olarak eklenir.
- Her durumda JSON'da saklanan mevcut/kırpılmış `src` kullanılır; Word çıktısına eski/orijinal kırpılmamış görüntü yanlışlıkla basılmaz.

## Düzen
- A4 portrait
- SOP: 10 mm yatay, 8/12 mm üst/alt marj
- Instruction: 8 mm yatay, 5/8 mm üst/alt marj
- Arial font
- Sabit tablo layout (`TableLayoutType.FIXED`)
- DXA/TWIP tabanlı fiziksel sütun ölçüleri
- `cantSplit` ile satırların sayfa ortasında parçalanması azaltılır
- Renk dolguları OOXML shading olarak yazılır

## Not
Word çıktısı uygulamaya geri import edilen master format değildir. Master kaynak JSON'dur. Word üzerinde yapılan değişiklikler JSON'a otomatik geri dönmez.
