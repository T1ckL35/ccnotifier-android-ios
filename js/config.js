var configStorage = {

    'storage_name': 'config',

    /**
     * return localstorage saved user data
     */
    "getData": function() {
        var rawConfig = localStorage.getItem(this.storage_name);
        if (rawConfig !== null) {
            return JSON.parse(rawConfig);
        }
      return null;
    },

    /**
     * saves/updates the config form data to localstorage
     */
    "saveData" : function(form_data) {
        config_data = JSON.stringify(form_data);
        // localStorage.userdata = config_data;
        localStorage[this.storage_name] = config_data;
    },

    /**
     * Clear the user's data from localstorage
     */
    "clearConfig": function() {
        localStorage.removeItem(this.storage_name);
    },
}