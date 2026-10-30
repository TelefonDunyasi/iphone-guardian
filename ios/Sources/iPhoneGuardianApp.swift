import SwiftUI
import Foundation

@main
struct iPhoneGuardianApp: App {
    var body: some Scene {
        WindowGroup {
            GuardianRootView()
                .preferredColorScheme(.dark)
        }
    }
}

private enum GuardianTheme {
    static let background = Color(red: 7/255, green: 20/255, blue: 38/255)
    static let panel = Color(red: 16/255, green: 35/255, blue: 59/255)
    static let cyan = Color(red: 57/255, green: 215/255, blue: 232/255)
    static let muted = Color(red: 169/255, green: 190/255, blue: 211/255)
}

struct GuardianRootView: View {
    var body: some View {
        TabView {
            ChecklistView()
                .tabItem { Label("Kontrol", systemImage: "checklist") }
            URLCheckView()
                .tabItem { Label("Bağlantı", systemImage: "link") }
            MessageCheckView()
                .tabItem { Label("Mesaj", systemImage: "message") }
            AppAdvisorView()
                .tabItem { Label("Uygulama", systemImage: "magnifyingglass") }
        }
        .tint(GuardianTheme.cyan)
        .background(GuardianTheme.background)
    }
}

struct GuardianTask: Identifiable, Codable {
    let id: String
    let title: String
    let detail: String

    static let all: [GuardianTask] = [
        .init(id: "pass", title: "Güçlü iPhone parolası", detail: "Tahmin edilmesi zor, benzersiz bir parola kullan."),
        .init(id: "face", title: "Face ID etkin", detail: "Ayarlar’da Face ID ve parola seçeneklerini kontrol et."),
        .init(id: "ios", title: "iOS güncel", detail: "Ayarlar → Genel → Yazılım Güncelleme bölümünü kontrol et."),
        .init(id: "find", title: "Bul özelliği açık", detail: "Apple hesabında iPhone’umu Bul’u etkinleştir."),
        .init(id: "2fa", title: "Apple hesabında iki faktörlü doğrulama", detail: "Hesap güvenlik ayarlarını gözden geçir."),
        .init(id: "privacy", title: "Uygulama izinleri gözden geçirildi", detail: "Konum, mikrofon, kamera ve fotoğraf erişimini kontrol et."),
        .init(id: "recovery", title: "Hesap kurtarma seçenekleri güncel", detail: "Güvenilir telefon numaralarını ve kurtarma kişisini gözden geçir."),
        .init(id: "stolen", title: "Çalınan Aygıt Koruması kontrol edildi", detail: "Ayarlar → Face ID ve Parola bölümünde özelliği kontrol et."),
        .init(id: "lockscreen", title: "Kilit ekranı bildirimleri gözden geçirildi", detail: "Kilitliyken hassas mesaj içeriklerinin görünmesini sınırla."),
        .init(id: "safari", title: "Safari güvenlik ayarları kontrol edildi", detail: "Sahte web sitesi uyarısı ve güvenli gezinme seçeneklerini kontrol et."),
        .init(id: "safety", title: "Güvenlik Denetimi gözden geçirildi", detail: "Gizlilik ve Güvenlik bölümünden paylaşımları ve erişimleri incele."),
        .init(id: "icloud", title: "iCloud yedekleme durumu kontrol edildi", detail: "iCloud Yedekleme bölümünde son yedekleme tarihini kontrol et."),
        .init(id: "profiles", title: "Yapılandırma profilleri incelendi", detail: "VPN ve Aygıt Yönetimi bölümünde tanımadığın profilleri incele.")
    ]
}

struct ChecklistView: View {
    @AppStorage("guardian.completed.v1") private var saved = "[]"
    @State private var completed: Set<String> = []
    @State private var search = ""
    @State private var filter = "Tümü"

    private var visibleTasks: [GuardianTask] {
        GuardianTask.all.filter { task in
            let matchesSearch = search.isEmpty || task.title.localizedCaseInsensitiveContains(search) || task.detail.localizedCaseInsensitiveContains(search)
            let matchesFilter = filter == "Tümü" || (filter == "Tamamlanan" && completed.contains(task.id)) || (filter == "Bekleyen" && !completed.contains(task.id))
            return matchesSearch && matchesFilter
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("DİJİTAL GÜVENLİK REHBERİN").font(.caption.bold()).tracking(1.2).foregroundStyle(GuardianTheme.cyan)
                        Text("iPhone’un için daha güvenli alışkanlıklar.").font(.largeTitle.bold())
                        Text("Kontrol listeni tamamla ve kendi ilerlemeni takip et.").foregroundStyle(GuardianTheme.muted)
                        HStack {
                            Text("\(completed.count) / \(GuardianTask.all.count) adım tamamlandı").font(.subheadline.bold())
                            Spacer()
                            Text("\(Int(Double(completed.count) / Double(GuardianTask.all.count) * 100))%").foregroundStyle(GuardianTheme.cyan).bold()
                        }
                        ProgressView(value: Double(completed.count), total: Double(GuardianTask.all.count)).tint(GuardianTheme.cyan)
                    }
                    .padding().background(GuardianTheme.panel, in: RoundedRectangle(cornerRadius: 20))
                    TextField("Kontrol maddelerinde ara…", text: $search)
                        .textFieldStyle(.roundedBorder)
                    Picker("Filtre", selection: $filter) {
                        Text("Tümü").tag("Tümü")
                        Text("Bekleyen").tag("Bekleyen")
                        Text("Tamamlanan").tag("Tamamlanan")
                    }
                    .pickerStyle(.segmented)
                    ForEach(visibleTasks) { task in
                        Button {
                            if completed.contains(task.id) { completed.remove(task.id) } else { completed.insert(task.id) }
                            save()
                        } label: {
                            HStack(alignment: .top, spacing: 12) {
                                Image(systemName: completed.contains(task.id) ? "checkmark.circle.fill" : "circle")
                                    .font(.title2).foregroundStyle(completed.contains(task.id) ? GuardianTheme.cyan : GuardianTheme.muted)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(task.title).font(.headline).foregroundStyle(.white)
                                    Text(task.detail).font(.subheadline).foregroundStyle(GuardianTheme.muted)
                                }
                                Spacer(minLength: 0)
                            }
                            .padding().frame(maxWidth: .infinity, alignment: .leading)
                            .background(GuardianTheme.panel, in: RoundedRectangle(cornerRadius: 14))
                        }
                        .buttonStyle(.plain)
                    }
                    Button(role: .destructive) {
                        completed.removeAll()
                        save()
                    } label: {
                        Label("Listeyi sıfırla", systemImage: "arrow.counterclockwise")
                    }
                    .padding(.top, 4)
                    Text("Bu puan yalnızca işaretlediğin rehber maddelerini gösterir; teknik cihaz taraması veya güvenlik garantisi değildir.")
                        .font(.footnote).foregroundStyle(GuardianTheme.muted)
                        .padding().background(GuardianTheme.panel, in: RoundedRectangle(cornerRadius: 12))
                }
                .padding()
            }
            .background(GuardianTheme.background)
            .navigationTitle("iPhone Guardian")
            .onAppear(perform: load)
        }
    }

    private func load() {
        let ids = (try? JSONDecoder().decode([String].self, from: Data(saved.utf8))) ?? []
        completed = Set(ids)
    }

    private func save() {
        let data = (try? JSONEncoder().encode(Array(completed))) ?? Data("[]".utf8)
        saved = String(decoding: data, as: UTF8.self)
    }
}

struct URLCheckView: View {
    @State private var input = ""
    @State private var report: LocalURLReport?

    var body: some View {
        NavigationStack {
            Form {
                Section("Şüpheli bağlantı") {
                    TextField("https://ornek.com", text: $input)
                        .keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button("Bu cihazda kontrol et") { report = LocalURLAnalyzer.analyze(input) }
                        .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                if let report {
                    Section(report.title) {
                        Text(report.explanation)
                        ForEach(report.signals, id: \.self) { Text("• \($0)") }
                        Text("Yerel işaret puanı: \(report.score)/100. URL herhangi bir sunucuya gönderilmedi.")
                            .font(.footnote).foregroundStyle(GuardianTheme.muted)
                    }
                }
                Section("Önemli sınır") {
                    Text("Bu kontrol yalnızca adres yapısındaki bazı risk işaretlerini arar. Dış tehdit listelerini, site içeriğini veya dosyaları taramaz. İşaret bulunmaması güvenlik garantisi değildir.")
                }
            }
            .scrollContentBackground(.hidden)
            .background(GuardianTheme.background)
            .navigationTitle("Bağlantı analizi")
        }
    }
}

struct LocalURLReport {
    let title: String
    let explanation: String
    let score: Int
    let signals: [String]
}

enum LocalURLAnalyzer {
    static func analyze(_ raw: String) -> LocalURLReport {
        guard let url = URL(string: raw.trimmingCharacters(in: .whitespacesAndNewlines)),
              let scheme = url.scheme?.lowercased(), ["http", "https"].contains(scheme),
              let host = url.host?.lowercased(), !host.isEmpty else {
            return .init(title: "Geçersiz adres", explanation: "http veya https ile başlayan geçerli bir web adresi gir.", score: 0, signals: [])
        }
        var score = 0
        var signals: [String] = []
        func add(_ points: Int, _ text: String) { score += points; signals.append(text) }
        if url.user != nil || url.password != nil { add(50, "Adrese kullanıcı adı veya parola eklenmiş.") }
        let labels = host.split(separator: ".")
        if host.contains(":") || host == "localhost" || host.hasSuffix(".local") || host.hasSuffix(".internal") ||
            (labels.count == 4 && labels.allSatisfy({ Int($0) != nil && (Int($0) ?? 999) <= 255 })) {
            add(35, "Genel alan adı yerine IP veya yerel ağ adresi kullanılıyor.")
        }
        if host.contains("xn--") { add(30, "Alan adı uluslararası kodlanmış karakterler içeriyor.") }
        let shorteners = ["bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "ow.ly", "lnkd.in"]
        if shorteners.contains(where: { host == $0 || host.hasSuffix("." + $0) }) { add(20, "Kısaltılmış bağlantı gerçek hedefi gizleyebilir.") }
        if labels.count >= 5 { add(15, "Alan adında olağandan fazla alt alan adı bulunuyor.") }
        if host.count > 60 { add(10, "Alan adı alışılmadık derecede uzun.") }
        if labels.contains(where: { $0.hasPrefix("-") || $0.hasSuffix("-") }) { add(10, "Alan adında dikkat gerektiren tire kullanımı var.") }
        if let port = url.port, !((scheme == "http" && port == 80) || (scheme == "https" && port == 443)) { add(15, "Standart dışı port kullanılıyor.") }
        if scheme == "http" { add(15, "Bağlantı şifreli HTTPS yerine HTTP kullanıyor.") }
        if signals.isEmpty { signals = ["Bu hızlı yerel kontrolde belirgin adres-yapısı risk işareti bulunmadı."] }
        let finalScore = min(score, 100)
        if finalScore >= 50 { return .init(title: "Yüksek dikkat", explanation: "Adres yapısında güçlü veya birden fazla risk işareti bulundu. Açmadan önce göndereni bağımsız kanaldan doğrula.", score: finalScore, signals: signals) }
        if finalScore > 0 { return .init(title: "Dikkat — adresi incele", explanation: "Bazı dikkat işaretleri bulundu; bunlar tek başına dolandırıcılık kanıtı değildir.", score: finalScore, signals: signals) }
        return .init(title: "Belirgin işaret bulunmadı", explanation: "Bu sonuç adresin güvenli olduğunu kanıtlamaz; dış tehdit veritabanı sorgulanmadı.", score: 0, signals: signals)
    }
}

struct MessageCheckView: View {
    @State private var message = ""
    @State private var report: MessageReport?

    var body: some View {
        NavigationStack {
            Form {
                Section("Şüpheli mesajı yapıştır") {
                    TextEditor(text: $message).frame(minHeight: 150)
                    Button("Mesajı cihazda analiz et") { report = MessageAnalyzer.analyze(message) }
                        .disabled(message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                if let report {
                    Section(report.title) {
                        Text(report.explanation)
                        ForEach(report.signals, id: \.self) { Text("• \($0)") }
                        Text("Sezgisel işaret puanı: \(report.score)/100. Mesaj metni sunucuya gönderilmedi.")
                            .font(.footnote).foregroundStyle(GuardianTheme.muted)
                    }
                }
                Section("Önemli sınır") {
                    Text("Bu özellik metindeki bazı dolandırıcılık kalıplarını arar. Her dolandırıcılığı yakalayamaz ve mesajın güvenli olduğunu kanıtlamaz.")
                }
            }
            .scrollContentBackground(.hidden)
            .background(GuardianTheme.background)
            .navigationTitle("Mesaj analizi")
        }
    }
}

struct MessageReport {
    let title: String
    let explanation: String
    let score: Int
    let signals: [String]
}

enum MessageAnalyzer {
    static func analyze(_ text: String) -> MessageReport {
        let value = text.lowercased()
        let patterns: [(Int, [String], String)] = [
            (25, ["şifreni", "parolanı", "password", "şifre", "hesabınız askıya", "hesabın askıya"], "Hesap veya parola bilgisi isteniyor olabilir."),
            (25, ["sms kodu", "doğrulama kodu", "tek kullanımlık kod", "otp", "güvenlik kodu", "kart bilg", "cvv", "iban"], "Doğrulama kodu veya finansal bilgi talebi var."),
            (20, ["hemen", "acil", "son dakika", "24 saat", "derhal", "erişiminiz kesilecek"], "Acele ettirme veya tehdit dili kullanılıyor."),
            (20, ["ödül", "kazandınız", "çekiliş", "hediye", "bedava", "iade", "kargonuz bekliyor"], "Ödül, iade veya teslimat bahanesi olabilir."),
            (20, ["havale", "eft", "para gönder", "ön ödeme", "kapora", "garantili kazanç"], "Para transferi veya olağan dışı kazanç vaadi olabilir."),
            (15, ["polis", "savcı", "mahkeme", "vergi dairesi", "banka güvenlik"], "Resmî kurum veya banka kimliğine bürünme ihtimali var.")
        ]
        var score = 0
        var signals: [String] = []
        for (points, terms, explanation) in patterns where terms.contains(where: { value.localizedCaseInsensitiveContains($0) }) {
            score += points
            signals.append(explanation)
        }
        if value.contains("http://") || value.contains("https://") || value.contains("www.") {
            score += 15
            signals.append("Mesajda bağlantı bulunuyor; açmadan önce ayrıca kontrol et.")
        }
        score = min(score, 100)
        if score >= 50 { return .init(title: "Yüksek dikkat", explanation: "Göndereni bağımsız kanaldan doğrulamadan bağlantıya dokunma, kod veya para paylaşma.", score: score, signals: signals) }
        if score > 0 { return .init(title: "Şüpheli olabilecek işaretler", explanation: "Mesajı dikkatle incele; özellikle kişisel bilgi, kod veya ödeme talebine temkinli yaklaş.", score: score, signals: signals) }
        return .init(title: "Belirgin kalıp bulunmadı", explanation: "Bu, mesajın güvenli olduğunu kanıtlamaz. Otomatik metin analizi her dolandırıcılığı yakalayamaz.", score: 0, signals: ["Belirgin bir kalıp bulunmadı."])
    }
}

struct AppAdvisorView: View {
    @State private var query = ""
    @State private var results: [StoreApp] = []
    @State private var status = ""
    @State private var loading = false

    var body: some View {
        NavigationStack {
            List {
                Section("App Store kaydı") {
                    TextField("Uygulama adı veya App Store bağlantısı", text: $query)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button(loading ? "Aranıyor…" : "Apple kataloğunda ara", action: search)
                        .disabled(loading || query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    if !status.isEmpty { Text(status).font(.footnote).foregroundStyle(GuardianTheme.muted) }
                }
                ForEach(results) { app in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(app.trackName).font(.headline)
                        Text("Geliştirici: \(app.sellerName ?? app.artistName ?? "Belirtilmemiş")")
                        Text("Kategori: \(app.primaryGenreName ?? "Belirtilmemiş") · Yaş: \(app.contentAdvisoryRating ?? "Belirtilmemiş")")
                        Text((app.userRatingCount ?? 0) > 0 ? "Puan: \((app.averageUserRating ?? 0), specifier: "%.1f")/5 (\(app.userRatingCount ?? 0))" : "Yeterli puan bilgisi yok")
                        Text("SONUÇ: Mağaza kaydı bulundu — güvenlik için ek inceleme gerekli.")
                            .font(.subheadline.bold()).foregroundStyle(GuardianTheme.cyan)
                        if let url = URL(string: app.trackViewUrl ?? "") {
                            Link("App Store sayfasını aç", destination: url)
                        }
                    }
                    .listRowBackground(GuardianTheme.panel)
                }
                Section("Önemli sınır") {
                    Text("Apple kataloğu yalnızca herkese açık mağaza bilgilerini sağlar. Uygulama paketini, çalışma davranışını veya gizli veri erişimini incelemez. Arama terimi Apple'ın kataloğuna gönderilir.")
                }
            }
            .scrollContentBackground(.hidden)
            .background(GuardianTheme.background)
            .navigationTitle("Uygulama danışmanı")
        }
    }

    private func search() {
        let raw = query.trimmingCharacters(in: .whitespacesAndNewlines)
        let idMatch = raw.range(of: #"(?i)(?:id|id=)(\d{5,})"#, options: .regularExpression)
        let appID = idMatch.flatMap { range -> String? in
            String(raw[range]).filter { $0.isNumber }.nilIfEmpty
        }
        var components = URLComponents(string: appID == nil ? "https://itunes.apple.com/search" : "https://itunes.apple.com/lookup")
        if let appID {
            components?.queryItems = [URLQueryItem(name: "id", value: appID), URLQueryItem(name: "country", value: "tr")]
        } else {
            components?.queryItems = [URLQueryItem(name: "term", value: raw), URLQueryItem(name: "entity", value: "software"), URLQueryItem(name: "country", value: "tr"), URLQueryItem(name: "limit", value: "20")]
        }
        guard let url = components?.url else { status = "Arama adresi oluşturulamadı."; return }
        loading = true
        status = "Apple App Store kataloğu sorgulanıyor. Uygulama dosyası taranmaz."
        Task {
            defer { loading = false }
            do {
                var request = URLRequest(url: url)
                request.timeoutInterval = 15
                request.setValue("application/json", forHTTPHeaderField: "Accept")
                let (data, _) = try await URLSession.shared.data(for: request)
                let response = try JSONDecoder().decode(StoreResponse.self, from: data)
                let terms = raw.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
                    .split(whereSeparator: \.isWhitespace).map(String.init).filter { $0.count > 1 }
                let matches = appID == nil
                    ? response.results.filter { app in
                        let name = app.trackName.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
                        return !terms.isEmpty && terms.allSatisfy { name.contains($0) }
                    }
                    : response.results
                results = matches
                status = matches.isEmpty ? "Bu adla doğrudan eşleşen uygulama bulunamadı. Tam adı veya App Store bağlantısını dene." : "\(matches.count) eşleşme bulundu. Geliştirici adını da kontrol et."
            } catch {
                results = []
                status = "Apple kataloğuna şu anda ulaşılamadı. Biraz sonra tekrar dene."
            }
        }
    }
}

struct StoreResponse: Decodable { let results: [StoreApp] }
struct StoreApp: Decodable, Identifiable {
    let trackId: Int
    let trackName: String
    let sellerName: String?
    let artistName: String?
    let primaryGenreName: String?
    let contentAdvisoryRating: String?
    let averageUserRating: Double?
    let userRatingCount: Int?
    let trackViewUrl: String?
    var id: Int { trackId }
}
private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
