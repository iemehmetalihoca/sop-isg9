# GitHub Pages Kurulum - LOTO SOP Editor v4.2.53

Bu paket GitHub Pages'a otomatik yayınlanacak şekilde hazırlanmıştır.

## En kolay yöntem: GitHub Desktop

1. GitHub'da yeni bir repository oluşturun. Örnek: `sop-isg6`.
2. Repository boş olsun; README / .gitignore / license eklemeyin.
3. GitHub Desktop ile repository'yi bilgisayarınıza clone edin.
4. Bu ZIP'i ayrı bir klasöre çıkarın.
5. ZIP'ten çıkan **tüm dosya ve klasörleri** clone ettiğiniz repository klasörünün içine kopyalayın.
   `.github` klasörü de mutlaka kopyalanmalıdır.
6. GitHub Desktop'ta `Publish v4.2.53` gibi bir commit mesajı yazıp **Commit to main** deyin.
7. **Push origin** deyin.
8. GitHub'da repo > Settings > Pages bölümüne girin.
9. Build and deployment > Source alanında **GitHub Actions** seçin.
10. Repo > Actions bölümünde `Deploy LOTO SOP Editor to GitHub Pages` işleminin yeşil tik ile bitmesini bekleyin.

Site adresi:
`https://KULLANICI_ADI.github.io/REPO_ADI/`

Örneğin repo adı `sop-isg6` ise:
`https://iemehmetalihoca.github.io/sop-isg6/`

## GitHub web arayüzüyle yükleyecekseniz

`Add file > Upload files` ekranında ZIP'in kendisini yüklemeyin. ZIP'i önce çıkarın ve içindeki tüm dosya/klasörleri sürükleyip bırakın.

Yükleme sonrası repo ana ekranında en az şunları görmelisiniz:
- `.github`
- `public`
- `src`
- `next.config.ts`
- `package.json`
- `tsconfig.json`

`.github/workflows/deploy-pages.yml` görünmüyorsa otomatik Pages yayını başlamaz.

## Sonraki sürümler

Aynı repository'yi kullanacaksanız eski kaynak dosyaları yeni sürümle değiştirip `main` branch'e push etmeniz yeterlidir. Her push sonrası GitHub Actions siteyi otomatik yeniden build edip yayınlar.
