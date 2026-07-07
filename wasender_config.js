// Configuración WasenderAPI - Lee de localStorage (cada cliente configura su propia key)
const WASENDER_CONFIG = {
  apiUrl: 'https://www.wasenderapi.com/api/send-message',
  apiKey: localStorage.getItem('wasender_api_key') || '',
  enabled: true
};

window.WASENDER_CONFIG = WASENDER_CONFIG;

if (WASENDER_CONFIG.apiKey) {
    console.log('✅ WasenderAPI configurado desde localStorage');
} else {
    console.log('⚠️ WasenderAPI no configurado - Configure su API Key en Ajustes');
}
