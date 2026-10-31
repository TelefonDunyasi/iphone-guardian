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

## Ücretsiz PhishTank oltalama sorgusu

Bağlantının cihaz içi adres biçimi analizi ücretsiz ve hesapsız çalışır. PhishTank'ın canlı oltalama veritabanı sorgusu için kullanıcının Guardian hesabıyla giriş yapması gerekir. Google Web Risk veya Google Cloud faturalandırması bu sürümde kullanılmaz.

1. Supabase Dashboard → Edge Functions → `smooth-responder` fonksiyonunu aç.
2. GitHub deposundaki [smooth-responder/index.ts](https://github.com/TelefonDunyasi/iphone-guardian/blob/main/supabase/functions/smooth-responder/index.ts) dosyasının tamamını kopyala.
3. Supabase fonksiyon editöründeki kodu bununla değiştir ve Deploy et.
4. PWA'yı aç, ücretsiz Guardian hesabına giriş yap ve bir HTTP/HTTPS adresini kontrol et.

PhishTank API anahtarı isteğe bağlıdır. Elinde ücretsiz bir uygulama anahtarı varsa Supabase Edge Functions → Secrets bölümünde `PHISHTANK_API_KEY` adıyla saklayabilirsin. Anahtarı HTML'e veya GitHub'a ekleme. Anahtar olmadan PhishTank daha düşük istek sınırları uygulayabilir.

Tam URL, kullanıcı canlı kontrolü başlattığında PhishTank'a gönderilir. Eşleşme bulunmaması güvenlik garantisi değildir; PhishTank tüm zararlı yazılım veya dolandırıcılık türlerini kapsamaz.

## Güvenlik ve kapsam

- Parolalar Guardian tarafından saklanmaz; Supabase Auth yönetir.
- İlerleme tablosunda RLS etkin ve her kullanıcı yalnızca kendi satırını okuyup yazabilir.
- Bu uygulama bir iPhone tarayıcısıdır; cihazı taramaz veya casus yazılım tespit etmez.
- Supabase ücretsiz plan koşulları ve e-posta gönderim limitleri değişebilir.
- Bu sürüm gerçek hesap ve bulut ilerleme senkronizasyonu sağlar; ödeme/abonelik sistemi içermez.
