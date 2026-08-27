# Shega POS — Hardware Setup Guide

## Supported Hardware Matrix

| Category | Models Tested | Interface | Notes |
|----------|---------------|-----------|-------|
| **Thermal Printers** | Epson TM-T20II/TM-T88V, Star TSP100, Bixolon SRP-350 | USB / Serial (COM) / Ethernet / Bluetooth | ESC/POS compatible |
| **Cash Drawers** | Epson DM-D30/DM-D50, Star CB2002, Generic RJ11 | RJ11 (printer-driven) / USB | Connect via printer or direct USB |
| **Barcode Scanners** | Zebra DS2208/DS3678, Honeywell Xenon 1900/1950 | USB HID (wedge) / Serial / Bluetooth SPP | HID = plug & play; Serial = config needed |
| **Scales** | CAS PD-II, Dibal 700, Mettler Toledo | Serial (RS-232) / USB | Continuous weight stream |

---

## 1. Thermal Printer Setup

### USB Connection (Recommended)
1. Connect printer via USB
2. Windows auto-installs driver (or install vendor driver)
3. In Shega: **Settings → Printer**
   - **Transport**: `USB`
   - **Vendor ID / Product ID**: Auto-detect or enter manually
   - Click **Test Print** → verify receipt

### Serial (COM) Connection
1. Connect via RS-232 cable or USB-to-Serial adapter
2. Note COM port (e.g., `COM3`) in Device Manager
3. In Shega: **Settings → Printer**
   - **Transport**: `Serial`
   - **Port**: `COM3` (or detected port)
   - **Baud Rate**: `115200` (default)
   - **Data Bits**: `8`, **Parity**: `None`, **Stop Bits**: `1`
   - Click **Test Print**

### Ethernet / Network
1. Connect printer to LAN via Ethernet
2. Configure static IP or DHCP reservation
3. In Shega: **Settings → Printer**
   - **Transport**: `TCP`
   - **Host**: `192.168.1.100` (printer IP)
   - **Port**: `9100` (default RAW port)
   - Click **Test Print**

### Bluetooth
1. Pair printer in Windows Bluetooth settings
2. Note outgoing COM port (e.g., `COM5`)
4. Configure as **Serial** with that COM port

---

## 2. Cash Drawer Setup

### Printer-Driven (RJ11) — Most Common
1. Connect drawer to printer's **RJ11** port (labeled "Drawer" or "DK")
2. No separate config needed — drawer kick command sent via printer
3. Test: **Settings → Cash Drawer → Test Kick**

### Direct USB
1. Connect drawer via USB
2. Install vendor driver (shows as HID or COM)
3. In Shega: **Settings → Cash Drawer**
   - **Transport**: `USB` or `Serial`
   - Configure VID/PID or COM port
   - Click **Test Kick**

---

## 3. Barcode Scanner Setup

### USB HID (Keyboard Wedge) — Plug & Play
1. Plug scanner USB → Windows recognizes as keyboard
2. No Shega config needed — scans go to focused input
4. Test: Open Register → focus search bar → scan barcode

### Serial (RS-232)
1. Connect via Serial or USB-to-Serial
2. Configure scanner for:
   - **Baud**: 9600 or 115200
   - **Terminator**: CR (Enter) or CR+LF
   - **Prefix/Suffix**: None
3. In Shega: **Settings → Scanner**
   - **Transport**: `Serial`
   - **Port**: `COMx`
   - Click **Test Scan**

### Bluetooth (SPP)
1. Pair in Windows → note outgoing COM port
2. Configure as **Serial** with that COM port

---

## 4. Scale Setup

### Serial Continuous Weight
1. Connect scale via RS-232 or USB-to-Serial
2. Configure scale for:
   - **Mode**: Continuous / Stream
   - **Baud**: 9600
   - **Format**: `ST,GS,+0000.000kg` (adjust to scale model)
3. In Shega: **Settings → Scale**
   - **Transport**: `Serial`
   - **Port**: `COMx`
   - **Parser**: Select scale model or "Generic"
   - Click **Test Weight** → place item on scale

---

## 5. Multi-Register Configuration

Each register needs:
1. Unique **Register ID** (Settings → Register)
2. Assigned **Printer**, **Drawer**, **Scanner**, **Scale**
3. Assigned **Warehouse** for stock deduction

**Setup Steps**:
1. Settings → Registers → **Add Register**
2. Name: `Register-1`, `Register-2`, etc.
3. Assign peripherals per register
4. Assign warehouse
5. Cashier selects register at login

---

## 6. Troubleshooting

| Symptom | Check |
|---------|-------|
| Printer: "No printer found" | USB cable, driver, VID/PID, COM port |
| Printer: Garbage chars | Baud rate mismatch (try 115200/9600) |
| Drawer: Won't open | RJ11 cable, printer drawer port, kick command |
| Scanner: No input | HID mode? Focus search bar. Serial? Check COM/baud. |
| Scale: No weight | Continuous mode? Correct parser? Correct COM? |
| Multi-register: Wrong stock | Correct warehouse assigned? |

---

## 7. Vendor-Specific Notes

### Epson TM-T20II / TM-T88V
- USB: VID=04B8, PID=0202 (TM-T20II) / 0E03 (TM-T88V)
- Default: 115200 8N1
- Drawer kick: `ESC p m t1 t2` (handled by driver)

### Star TSP100 / TSP650
- USB: VID=0519, PID=0001
- Use StarUSB driver or generic

### Zebra DS2208 / DS3678
- HID mode: Scan "USB Keyboard" config barcode
- Serial: Scan "RS-232" config, set 115200 8N1

### Honeywell Xenon 1900/1950
- HID: Default
- Serial: Configure via Honeywell EZConfig

---

## 8. Firmware & Driver Updates

- Check vendor sites quarterly for firmware updates
- Windows Update may install generic drivers — prefer vendor drivers
- Test after any OS/driver update: print, drawer, scan, weigh

---

*Shega POS v1.0 — Hardware setup reference for Epson, Star, Bixolon, Zebra, Honeywell, CAS, Dibal, Mettler Toledo*