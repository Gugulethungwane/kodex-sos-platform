    def trigger_sos(self):
        # OFFLINE VERSION - No internet needed
        success = self.sos.send_sos_offline()
        if success:
            Snackbar(text="✅ SMS app opened! Press SEND - No data needed").open()
        else:
            Snackbar(text="❌ Could not open SMS").open()

    def trigger_sos_all(self):
        # Sends to Mama + SAPS + Sister
        self.sos.send_to_all_contacts_offline()
        Snackbar(text="✅ Opening SMS for all 3 contacts...").open()