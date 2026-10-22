import urllib.parse
import webbrowser
from datetime import datetime
from kivy.utils import platform
from kivy.storage.jsonstore import JsonStore

# Save last known location offline
store = JsonStore('khusela.json')

class SOSManager:
    def __init__(self):
        self.contacts = [
            {"name": "Mama", "phone": "0821234567"},
            {"name": "SAPS", "phone": "10111"},
            {"name": "Sister Zanele", "phone": "0739876543"}
        ]
    
    def get_location_offline(self):
        # 1. Try get last saved location (works fully offline)
        try:
            if store.exists('last_location'):
                data = store.get('last_location')
                return data['lat'], data['lon']
        except:
            pass
        
        # 2. Fallback - Umlazi (you will replace with plyer.gps later)
        return -29.9665, 30.8915

    def save_location(self, lat, lon):
        store.put('last_location', lat=lat, lon=lon, time=str(datetime.now()))

    def build_sos_message(self, lat, lon):
        maps_link = f"https://maps.google.com/?q={lat},{lon}"
        # Short message to fit 1 SMS (160 chars)
        msg = f"🚨 KHUSELA SOS! Need help now! {datetime.now().strftime('%H:%M')} I'm at: {maps_link} - Sibongile"
        return msg

    def send_sos_offline(self):
        lat, lon = self.get_location_offline()
        message = self.build_sos_message(lat, lon)
        encoded_msg = urllib.parse.quote(message)

        # This opens SMS app directly - NO INTERNET NEEDED
        # Option A: Open to all contacts (user picks)
        sms_link_all = f"sms:?&body={encoded_msg}"
        
        # Option B: Open directly to Mama
        # sms_link_mama = f"sms:{self.contacts[0]['phone']}?body={encoded_msg}"

        print(f"Opening: {sms_link_all}")
        
        try:
            if platform == 'android':
                # Android proper way - opens SMS composer
                from jnius import autoclass
                Intent = autoclass('android.content.Intent')
                Uri = autoclass('android.net.Uri')
                PythonActivity = autoclass('org.kivy.android.PythonActivity')
                
                intent = Intent(Intent.ACTION_VIEW)
                intent.setData(Uri.parse(f"sms:{self.contacts[0]['phone']}"))
                intent.putExtra("sms_body", message)
                currentActivity = PythonActivity.mActivity
                currentActivity.startActivity(intent)
            else:
                # For PC testing
                webbrowser.open(sms_link_all)
            return True
        except Exception as e:
            print(f"SMS open failed: {e}")
            webbrowser.open(sms_link_all)
            return True

    def send_to_all_contacts_offline(self):
        # Opens SMS app 3 times - one for each trusted contact
        lat, lon = self.get_location_offline()
        message = self.build_sos_message(lat, lon)
        
        for contact in self.contacts:
            encoded = urllib.parse.quote(message)
            link = f"sms:{contact['phone']}?body={encoded}"
            webbrowser.open(link)