# iPhone Guardian — gerçek üyelik kurulumu

Arayüz; e-posta/parola kaydı, giriş, e-posta doğrulaması, parola sıfırlama, oturum saklama/yenileme ve kullanıcının kendi kontrol listesini buluta eşitleme için Supabase Auth kullanır.

## Bir defalık Supabase kurulumu

1. https://supabase.com adresinde ücretsiz bir proje oluştur.
2. Project Settings → API bölümünden Project URL ve anon / publishable public key değerlerini al. service_role / secret key'i asla kullanma veya paylaşma.
3. Supabase SQL Editor'da supabase-schema.sql dosyasının tamamını çalıştır.
4. Authentication → URL Configuration bölümünde Site URL değerini https://telefondunyasi.github.io/iphone-guardian/ yap. Redirect URLs listesine aynı adresi ekle.
5. Authentication → Providers → Email bölümünde Email provider açık olsun. E-posta doğrulamasını açık tutmanı öneririz.
6. supabase-config.js dosyasındaki url ve anonKey alanlarını kendi Project URL ve anon/publishable key değerlerinle doldur. Service role anahtarını buraya koyma.
7. GitHub Pages'in yeni sürümü yayınlamasını bekle. Siteyi Safari'de açıp ücretsiz hesap oluştur; doğrulama e-postasını onayla ve giriş yap.

## Google Web Risk gerçek tehdit listesi bağlantısı

Bu özellik, URL'leri Google Web Risk Lookup API üzerinde zararlı yazılım, sosyal mühendislik/oltalama ve istenmeyen yazılım listelerinde sorgular. Yerel adres analizi ücretsiz ve cihaz içindedir; harici sorgu için kullanıcı girişi, Google Cloud projesi, Web Risk API etkinleştirmesi, API anahtarı ve Google Cloud faturalandırma hesabı gerekebilir. Google'ın yayımladığı fiyatlandırmada Lookup API için ayda ilk 100.000 sorgu ücretsiz görünür; Google Cloud yine de faturalandırma hesabı bağlanmasını isteyebilir.

Kurulum:
1. Google Cloud Console'da bir proje seç veya oluştur.
2. Web Risk API'yi etkinleştir ve bir API anahtarı oluştur. Anahtarı yalnızca Web Risk API ile sınırla.
3. Supabase Dashboard → Edge Functions bölümünde `url-threat-check` adlı yeni fonksiyon oluştur ve `supabase/functions/url-threat-check/index.ts` içeriğini dağıt.
4. Supabase Dashboard → Edge Functions → Secrets bölümünde `GOOGLE_WEBRISK_API_KEY` adlı secret oluştur ve Google API anahtarını değer olarak ekle. Bu anahtarı GitHub'a, HTML'e veya `supabase-config.js` dosyasına yazma.
5. Fonksiyonun JWT doğrulaması açık kalsın. PWA'da Google Web Risk sorgusu için kullanıcının hesabıyla giriş yapması gerekir.
6. Dağıtımdan sonra `https://telefondunyasi.github.io/iphone-guardian/` adresinde oturum açarak URL kontrolünü dene.

Google Web Risk sorgusu tam URL'yi Google'a gönderir. Harici sorgu isteğe bağlıdır. Eşleşme yok sonucu güvenlik garantisi değildir. Mesaj analizi cihaz içinde kalır.

## Güvenlik ve kapsam

- Parolalar Guardian tarafından saklanmaz; Supabase Auth yönetir.
- İlerleme tablosunda RLS etkin ve her kullanıcı yalnızca kendi satırını okuyup yazabilir.
- Bu uygulama bir iPhone tarayıcısıdır; cihazı taramaz veya casus yazılım tespit etmez.
- Supabase ücretsiz plan koşulları ve e-posta gönderim limitleri değişebilir.
- Bu sürüm gerçek hesap ve bulut ilerleme senkronizasyonu sağlar; ödeme/abonelik sistemi içermez.
