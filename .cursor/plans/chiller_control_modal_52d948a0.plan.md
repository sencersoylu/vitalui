---
name: Chiller Control Modal
overview: Dashboard sayfasındaki Chamber Control kartına Chiller butonu eklenecek ve bu buton tıklandığında SMC HRS Thermo Chiller ünitesini kontrol edebilen bir modal açılacak.
todos:
  - id: create-modal
    content: ChillerControlModal.tsx komponenti oluştur
    status: completed
  - id: update-store
    content: Store'a chiller state'lerini ekle
    status: completed
  - id: update-dashboard
    content: Dashboard'a buton ve modal entegrasyonu ekle
    status: completed
    dependencies:
      - create-modal
      - update-store
---

# Chiller Kontrol Paneli

## Özet

Dashboard'daki Chamber Control kartına "Chiller" butonu eklenecek. Butona tıklandığında açılan modal ile:

- Chiller ünitesini açma/kapama
- Su sıcaklığını ayarlama
- Mevcut sıcaklığı görüntüleme

## Teknik Detaylar (HRX-OM-M091 Dökümanından)

MODBUS Register Map:

- `0x0000`: Mevcut sıcaklık (okuma) - 0.1°C çözünürlük
- `0x0005`: Hedef sıcaklık ayarı (okuma/yazma) - 0.1°C çözünürlük
- `0x0006`: Çalıştırma komutu (0=Durdur, 1=Çalıştır)

## Yapılacaklar

### 1. ChillerControlModal Komponenti Oluşturma

Yeni dosya: [`renderer/components/ChillerControlModal.tsx`](renderer/components/ChillerControlModal.tsx)

- Mevcut `O2AnalyzerSettings.tsx` stiline benzer modal tasarımı
- Sıcaklık göstergesi (mevcut/hedef)
- Sıcaklık ayar slider'ı (5°C - 35°C arası)
- Açma/Kapama toggle butonu
- Socket.io ile MODBUS komutları gönderme

### 2. Dashboard Güncellemesi

Dosya: [`renderer/pages/dashboard.tsx`](renderer/pages/dashboard.tsx)

- Chamber Control kartına "Chiller" butonu ekleme (Ventilation butonunun altına)
- Modal state yönetimi (`showChillerModal`)
- ChillerControlModal komponenti import ve render

### 3. Store Güncellemesi

Dosya: [`renderer/store.ts`](renderer/store.ts)

- Chiller state'leri ekleme:
- `showChillerModal: boolean`
- `chillerRunning: boolean`
- `chillerCurrentTemp: number`
- `chillerSetTemp: number`

## UI Tasarımı

Modal içeriği:

- Başlık: "Chiller Control" (kar tanesi ikonu)
- Mevcut sıcaklık göstergesi (büyük font, mavi renk)
- Hedef sıcaklık slider'ı
- Run/Stop toggle butonu (yeşil/kırmızı)
- Kapat butonu

Dashboard butonu:

- "Chiller" yazısı
- Mevcut butonlarla aynı stil
- Chiller durumuna göre renk (çalışıyor: mavi, durdu: gri)
