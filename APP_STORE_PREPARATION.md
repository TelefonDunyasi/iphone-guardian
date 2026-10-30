# iPhone Guardian — App Store hazırlık dosyası

**Durum:** Hazırlık taslağı. Henüz derlenmiş, imzalanmış veya App Store Connect'e yüklenmiş bir uygulama değildir.

## Önerilen ürün tanımı
iPhone Guardian, iPhone güvenlik alışkanlıklarını gözden geçirmek için yerel kontrol listesi, bağlantı adresi işaret analizi, mesaj metni işaret analizi ve Apple App Store katalog danışmanı sunar. iPhone'u arka planda taramaz; diğer uygulamaların dosyalarını/izinlerini göremez; casus yazılım tespiti iddiasında bulunmaz.

## App Store ürün sayfası taslağı
- **Ad:** iPhone Guardian
- **Alt başlık:** Güvenlik rehberi ve akıllı kontroller
- **Kategori önerisi:** Utilities (Yardımcı Programlar)
- **Birincil dil:** Türkçe
- **Fiyat:** Ücretsiz
- **Anahtar kelime taslağı:** iPhone,güvenlik,gizlilik,dolandırıcılık,bağlantı,mesaj,kontrol listesi
- **Promosyon metni:** iPhone güvenlik alışkanlıklarını gözden geçir. Şüpheli bağlantı ve mesajlardaki dikkat işaretlerini cihazında incele.
- **Açıklama:**

iPhone Guardian, dijital güvenlik alışkanlıklarını daha bilinçli yönetmene yardımcı olan bir rehberdir.

ÖZELLİKLER
• 13 maddelik iPhone güvenlik kontrol listesi ve ilerleme özeti.
• Bağlantı adreslerinde bazı risk işaretlerini cihaz üzerinde inceleme.
• SMS, WhatsApp ve e-posta metinlerinde yaygın dolandırıcılık kalıplarını yerel olarak kontrol etme.
• Apple App Store kataloğunda uygulama adı, geliştirici, kategori, yaş derecesi ve kullanıcı puanı arama.

GİZLİLİK
Kontrol listesi ilerlemesi cihazda saklanır. Bağlantı ve mesaj analizleri cihaz üzerinde yapılır. Uygulama danışmanı arama terimini Apple'ın App Store katalog servisine gönderir.

ÖNEMLİ
iPhone Guardian antivirüs veya casus yazılım tarayıcısı değildir. iPhone'u arka planda taramaz, yüklü uygulamaların içeriğine erişmez ve WhatsApp mesajlarını okuyamaz. URL ve mesaj sonuçları sezgisel işaretlere dayanır; güvenlik garantisi değildir.

## App Review notu taslağı
Uygulama hesap gerektirmez. Tüm ana özellikler giriş yapmadan kullanılabilir. URL ve mesaj analizi cihaz üzerinde gerçekleştirilir. App Store danışmanı yalnızca Apple'ın herkese açık katalog API'sini sorgular. Uygulama başka uygulamaların paketlerini veya cihaz dosyalarını taramaz; güvenlik/antivirüs tespiti iddiası yoktur. Premium/ödeme/abonelik bu sürümde bulunmaz.

## Gizlilik beyanı için başlangıç notu
Bu beyan, yalnızca `ios/` altındaki önerilen yerel SwiftUI uygulaması için hazırlanmıştır. Web/PWA sürümündeki isteğe bağlı Supabase hesabı ve senkronizasyonu bu iOS taslağına dahil değildir. Gerçek binary, tüm SDK'lar ve ağ istekleri test edilmeden App Store Connect gizlilik etiketleri kesinleştirilmemelidir.

## Gönderim öncesi eksikler
- [ ] macOS ve güncel Xcode ile XcodeGen kullanarak `ios/project.yml` üzerinden Xcode projesi üret.
- [ ] Gerçek iPhone'da derle, tüm ekranları ve hata durumlarını test et; erişilebilirlik ve VoiceOver kontrolleri yap.
- [ ] Uygulama simgesi, açılış ekranı ve App Store ekran görüntülerini üret.
- [ ] Bundle ID ve App Store Connect kaydını geliştirici hesabında oluştur.
- [ ] Gerçek geliştirici/iletişim bilgilerini ve destek URL'sini doğrula.
- [ ] App Privacy yanıtlarını gerçek binary ve SDK envanterine göre doldur.
- [ ] Yaş derecelendirme anketini yanıtla.
- [ ] TestFlight ile test et.
- [ ] Apple incelemesine gönder.

## Teknik gereklilik
Bu klasördeki SwiftUI kaynak kodu bir başlangıç sürümüdür; bu ortamda Xcode ile derlenip iPhone üzerinde test edilmedi. App Store'a gönderilebilir imzalı IPA/Archive üretildiği anlamına gelmez. App Store yayını için Apple Developer Program üyeliği, Xcode ile imzalama ve App Store Connect yüklemesi gerekir.
