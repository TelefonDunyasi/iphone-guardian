# iPhone Guardian

iPhone Guardian, iPhone kullanıcıları için Türkçe hazırlanmış, Safari üzerinden kurulabilen bir güvenlik rehberi ve kontrol listesi (PWA).

## Bu sürümde bulunanlar

- iPhone güvenlik kontrol listesi, arama ve tamamlanan/bekleyen filtreleri.
- İsteğe bağlı Supabase hesabı ve kullanıcının kendi ilerlemesini buluta eşitleme.
- Apple Account, WhatsApp, gizlilik, kayıp cihaz hazırlığı, iCloud yedekleme, Security Checkup ve yapılandırma profilleri için pratik rehberler.
- Paylaşılabilir kontrol listesi raporu.
- Ücretsiz, cihaz içinde çalışan bağlantı adresi analizi. URL harici bir güvenlik servisine gönderilmez.
- SMS/WhatsApp/e-posta metinleri için cihaz içinde çalışan sezgisel dolandırıcılık işaretleri analizi.
- Apple App Store kataloğundan uygulama adı, geliştirici, kategori, yaş derecesi ve puan gibi herkese açık mağaza bilgilerinin görüntülenmesi.

## Yayın ve iPhone'a kurulum

GitHub Pages, `main` dalının kök klasörünü yayınlar. Uygulamanın giriş dosyası `index.html` dosyasıdır.

1. https://telefondunyasi.github.io/iphone-guardian/ adresini iPhone'da Safari ile aç.
2. Paylaş düğmesine dokun.
3. Ana Ekrana Ekle seçeneğini kullan.

## Supabase hesap ve eşitleme kurulumu

Supabase Auth ve `guardian_progress` tablosu kurulumu için [AUTH_SETUP.md](AUTH_SETUP.md) dosyasına bak. Tarayıcıda yalnızca proje URL'si ve public anon/publishable key bulunmalıdır. Service-role/secret key hiçbir zaman HTML veya GitHub'a eklenmemelidir. İlerleme tablosunda Row Level Security (RLS) açık tutulmalıdır.

URL kontrolü artık Supabase Edge Function, Google Web Risk, PhishTank veya ücretli bir güvenlik API'si çağırmaz. Google Cloud faturalandırması veya API anahtarı gerekmez. Eski Edge Function dosyaları depoda kalmış olabilir; mevcut web uygulaması bunları çağırmaz.

## Güvenlik ve gizlilik sınırları

- Bu ürün yerel bir web uygulamasıdır; yerel iPhone uygulaması veya native iOS antivirüsü değildir.
- iPhone'u arka planda tarayamaz, başka uygulamaların dosyalarını/izinlerini inceleyemez, WhatsApp mesajlarını okuyamaz ve casus yazılım tespit ettiğini iddia edemez.
- Bağlantı kontrolü yalnızca URL'nin biçimsel özelliklerinde bazı risk işaretlerini arar. Bilinen zararlı URL/oltalama listelerini, sayfa içeriğini veya indirilen dosyaları taramaz. Risk işareti bulunmaması güvenlik garantisi değildir.
- Mesaj analizi sezgisel metin kalıplarına dayanır; her dolandırıcılığı tespit edemez. Mesaj metni analiz için sunucuya gönderilmez.
- App Store danışmanı Apple'ın herkese açık katalog verisini gösterir; uygulama paketini, kodunu, davranışını veya cihazdaki yüklü uygulamaları incelemez.
- Kontrol listesi puanı yalnızca kullanıcının işaretlediği rehber maddelerini yansıtır; teknik cihaz taraması değildir.
- Üyelik/ödeme alanı yalnızca önizlemedir. Premium satın alma, abonelik veya ödeme tahsilatı etkin değildir.

## App Store durumu

Bu sürüm GitHub Pages üzerinden çalışan bir PWA'dır; Apple App Store'da yayımlanmış native uygulama değildir. Native App Store sürümü için SwiftUI ile ayrı iOS uygulaması, Xcode ile derleme/test ve Apple Developer dağıtım süreci gerekir.
