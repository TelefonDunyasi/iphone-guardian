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

## Ücretsiz bağlantı kontrolü

- Bağlantı adresi analizi uygulama içinde, cihazda çalışır; Supabase Edge Function veya Google Web Risk çağrısı yapmaz.
- URL analizi için Google Cloud faturalandırması, Web Risk API anahtarı veya PhishTank anahtarı gerekmez.
- Mesaj analizi de cihaz içinde sezgisel metin kalıplarını kullanır.

## Güvenlik ve kapsam

- Parolalar Guardian tarafından saklanmaz; Supabase Auth yönetir.
- İlerleme tablosunda RLS etkin ve her kullanıcı yalnızca kendi satırını okuyup yazabilir.
- Bu uygulama bir iPhone tarayıcısıdır; cihazı taramaz veya casus yazılım tespit etmez.
- Supabase ücretsiz plan koşulları ve e-posta gönderim limitleri değişebilir.
- Bu sürüm gerçek hesap ve bulut ilerleme senkronizasyonu sağlar; ödeme/abonelik sistemi içermez.
