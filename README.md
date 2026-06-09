# 🏆 FIFA Dünya Kupası 2026 Ofis Tahmin Oyunu

Bu proje, 2026 FIFA Dünya Kupası için özel olarak tasarlanmış, modern, mobil uyumlu, performanslı ve tamamen istemci tarafında (Local Storage) çalışan bir ofis tahmin oyunu web uygulamasıdır. Katılımcılar grup ve eleme aşaması tahminlerini kolayca oluşturup paylaşabilir; yöneticiler ise gerçek maç sonuçlarını girerek canlı liderlik tablosunu anlık olarak takip edebilirler.

---

## 🚀 Öne Çıkan Özellikler

* **Modern ve Estetik Arayüz**: Dünya Kupası 2026 temasına uygun koyu lacivert, kırmızı, beyaz ve altın sarısı tonlarında modern kart tabanlı tasarım (Glassmorphism & Mikro animasyonlar).
* **Mobil Uyumlu Tasarım (Responsive)**: Telefon, tablet ve masaüstü cihazlarda kusursuz çalışan, mobil cihazlarda kolay geçiş sunan sekmeli arayüz yapısı.
* **Gelişmiş Grup Puan Tablosu Simülasyonu**: Girilen tahminlere göre grup puan durumları, averajlar ve atılan goller anında hesaplanır.
* **Dinamik Eleme Ağacı (Knockout Bracket)**:
  * Grup maçları tamamlandığında en iyi 8 üçüncü takım FIFA kurallarına göre (Annex C kombinasyonları) otomatik olarak Son 32 turuna yerleştirilir.
  * Eleme aşamalarındaki beraberlik durumlarında kazananı belirlemek için "Tur Atlayan Takım" seçimi zorunlu tutulur.
  * Bir önceki turun galipleri dinamik olarak bir sonraki tura aktarılır.
* **Bonus Podyum Tahminleri**: Turnuva şampiyonu, ikincisi, üçüncüsü ve dördüncüsü tahmin edilir (Grup ve eleme ağacı sonuçlarından otomatik çekilir).
* **Kolay Paylaşım ve Import/Export**: Tahminler, e-posta veya mesajlaşma platformları üzerinden paylaşılmak üzere özel bir etiketli metin formatına dönüştürülür (`WC2026_TAHMIN` ... `END_WC2026_TAHMIN`). Yönetici bu metni doğrudan kopyalayıp sisteme ekleyebilir.
* **Yönetici Modülü & Şifreli Giriş**:
  * Şifreli giriş paneli (Şifre: `admin2026`).
  * Gerçek maç sonuçlarının girilmesi ve güncellenmesi.
  * Katılımcı ekleme, çıkarma ve verileri üzerine yazarak güncelleme.
  * Tüm veri tabanını (Local Storage) JSON dosyası olarak yedekleme (Export) ve geri yükleme (Import).
* **Görsel Kart Paylaşımı (html2canvas)**: Maç detay sayfalarında her maç için katılımcıların tahmin dağılımı listelenir ve bu analiz kartı tek tıkla görsel (.png) olarak panoya kopyalanabilir.

---

## 📊 Puanlama Motoru Kuralları

Puanlar, gerçek sonuçlar girildikçe sistem tarafından otomatik olarak hesaplanır:

### 1. Grup Aşaması Puanlaması
* **Tam Skor İsabeti (+3 Puan)**: Maçın skorunu (örneğin 2-1) birebir doğru tahmin etmek.
* **Sonuç İsabeti (+1 Puan)**: Maçın sonucunu (Galibiyet/Beraberlik/Mağlubiyet) doğru tahmin etmek ancak skoru tutturamamak.
* **Başarısız Tahmin (0 Puan)**: Maç sonucunun tamamen yanlış tahmin edilmesi.

### 2. Eleme Aşaması (Knockout) Puanlaması
* **Yanlış Eşleşme (0 Puan)**: Tahmin edilen eşleşmedeki takımların, gerçekte o turda karşılaşmamış olması durumunda o maçtan puan alınamaz.
* **Tam Skor İsabeti (+3 Puan)**: Eşleşme doğru olduğunda ve normal süre/uzatmalar skoru birebir doğru tahmin edildiğinde verilir.
* **Sonuç İsabeti (+1 Puan)**: Eşleşme doğru olduğunda, kazanan takım veya beraberlik sonucu doğru tahmin edildiğinde ancak skor tutmadığında verilir.
* *Not*: Eleme turlarında beraberlik tahmin edildiyse, turu geçen takımı doğru bilmek de sonuç isabeti kapsamında değerlendirilir.

### 3. Bonus Podyum Puanlaması
* **Şampiyon Doğru Tahmini**: **+10 Puan**
* **İkinci Doğru Tahmini**: **+5 Puan**
* **Üçüncü Doğru Tahmini**: **+4 Puan**
* **Dördüncü Doğru Tahmini**: **+3 Puan**

---

## ⚖️ Eşitlik Bozma (Tie-Breaker) Kuralları

Katılımcıların puanları eşit olduğunda, sıralama aşağıdaki öncelik sırasına göre belirlenir:
1. **Toplam Puan**: En yüksek puana sahip olan üstte yer alır.
2. **Tam Skor Sayısı**: Grup ve eleme aşamalarında en fazla 3 puanlık (Tam Skor) tahmin yapan katılımcı üstte yer alır.
3. **Eleme Aşaması Puanı**: Eleme aşaması maçlarından (Son 32'den itibaren) en fazla puan toplayan katılımcı üstte yer alır.
4. **Bonus Podyum Puanı**: Podyum tahminlerinden en yüksek puanı alan katılımcı üstte yer alır.
5. **Alfabetik Sıralama**: Eşitlik hala bozulmadıysa katılımcı ismine göre alfabetik sıralama uygulanır.

---

## 🛠️ Teknolojik Altyapı

* **Frontend**: React 19 (Hooks, Context, State yönetimi), TypeScript.
* **Derleyici / Araçlar**: Vite 8.
* **Stil / CSS**: Tailwind CSS v4 (`@tailwindcss/vite` eklentisi ve CSS değişkenleri tabanlı yeni mimari).
* **Test**: Vitest (İş mantığı ve hesaplamaların test edilmesi için 13 adet kapsamlı test paketi).
* **Kütüphaneler**: 
  * `lucide-react` (Modern ve minimalist ikon seti).
  * `html2canvas` (Analiz kartlarının resme dönüştürülüp paylaşılması).

---

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları takip edebilirsiniz.

### Gereksinimler
* Node.js (v18 veya üzeri önerilir)
* npm veya yarn

### 1. Bağımlılıkları Yükleyin
Proje dizininde terminali açın ve bağımlılıkları yükleyin:
```bash
npm install
```

### 2. Geliştirme Sunucusunu Başlatın
Uygulamayı lokal geliştirme ortamında ayağa kaldırmak için:
```bash
npm run dev
```
Tarayıcınızda `http://localhost:5173` (veya terminalde belirtilen adresi) açarak uygulamaya erişebilirsiniz.

### 3. Birim Testlerini Çalıştırın
Puanlama motorunu, grup averaj hesaplamalarını ve en iyi üçüncüler algoritmasını test etmek için:
```bash
npm run test
```

### 4. Üretim Derlemesi (Build) Alın
Uygulamayı yayına hazır hale getirmek için optimize edilmiş üretim paketini oluşturun:
```bash
npm run build
```
Bu komut sonucunda oluşan `dist` klasöründeki dosyaları herhangi bir statik web sunucusuna (Netlify, Vercel, GitHub Pages vb.) yükleyerek yayına alabilirsiniz.

---

## 🔑 Yönetici Girişi (Admin)

Takip sayfasının sağ üstünde yer alan **Yönetici Paneli** butonuna tıklayıp aşağıdaki şifreyle giriş yapabilirsiniz:
* **Şifre**: `admin2026`

Bu panelde:
1. Gerçek maç skorlarını girerek anında kaydeder ve liderlik tablosunu güncellersiniz.
2. Katılımcıların oluşturup kopyaladığı tahmin metinlerini topluca ekleyebilirsiniz.
3. Turnuva bittiğinde gerçek podyum (Şampiyon, 2., 3., 4.) takımlarını girip bonus puanları hesaplatabilirsiniz.
4. Tüm sistemi sıfırlayabilir, yedek alabilir veya yedekten geri yükleyebilirsiniz.

---

## 📝 Tahmin Paylaşım Formatı Örneği

Katılımcılar tahminlerini tamamladığında oluşan metin bloğu şu şekildedir:
```text
WC2026_TAHMIN
{
  "participantName": "Ahmet Yılmaz",
  "groupPredictions": {
    "1": { "homeGoals": 2, "awayGoals": 1 },
    "2": { "homeGoals": 0, "awayGoals": 0 },
    ...
  },
  "knockoutPredictions": {
    "73": { "homeGoals": 1, "awayGoals": 2, "homeTeamId": "MEX", "awayTeamId": "CRO", "winnerTeamId": "CRO" },
    ...
  },
  "bonus": {
    "champion": "ARG",
    "runnerUp": "FRA",
    "thirdPlace": "ESP",
    "fourthPlace": "ENG"
  }
}
END_WC2026_TAHMIN
```
Bu format, veri aktarımının hatasız ve platformlar arası uyumlu bir şekilde yapılmasını garanti eder.
