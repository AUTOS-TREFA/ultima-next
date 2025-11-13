# Google Tag Manager Setup Guide for TREFA

This guide will help you configure Google Tag Manager (GTM) to capture all conversion events from your app.

## 📊 Events Being Tracked

Your app now automatically tracks these events:

1. **PageView** - Every page/route change
2. **ConversionLandingPage** - User registration on /financiamientos  
3. **PersonalInformationComplete** - User profile completion
4. **LeadComplete** - Application submission
5. **InitialRegistration** - User authentication (OTP/Google)

## 🔧 GTM Container ID

Your GTM Container ID: **GTM-KDVDMB4X**

## 📝 Step-by-Step Setup in GTM

### 1. Create Custom Events (Triggers)

For each event, create a Custom Event trigger in GTM:

#### PageView Event Trigger
```
Trigger Type: Custom Event
Event name: page_view
This trigger fires on: All Custom Events
```

#### ConversionLandingPage Event Trigger
```
Trigger Type: Custom Event  
Event name: conversion_landing_page
This trigger fires on: All Custom Events
```

#### PersonalInformationComplete Event Trigger
```
Trigger Type: Custom Event
Event name: personal_information_complete
This trigger fires on: All Custom Events
```

#### LeadComplete Event Trigger
```
Trigger Type: Custom Event
Event name: lead_complete
This trigger fires on: All Custom Events
```

### 2. Create Data Layer Variables

In GTM, create these Data Layer Variables to access event metadata:

- **eventType**: Data Layer Variable = `eventType`
- **page**: Data Layer Variable = `page`
- **utm_source**: Data Layer Variable = `utm_source`
- **utm_medium**: Data Layer Variable = `utm_medium`
- **utm_campaign**: Data Layer Variable = `utm_campaign`
- **value**: Data Layer Variable = `value`
- **currency**: Data Layer Variable = `currency`

### 3. Create GA4 Event Tags (if using Google Analytics 4)

For each trigger, create a GA4 Event tag. Example:

#### ConversionLandingPage GA4 Event
```
Tag Type: Google Analytics: GA4 Event
Configuration Tag: [Your GA4 Configuration Tag]
Event Name: conversion_landing_page

Event Parameters:
- page: {{page}}
- event_type: {{eventType}}
- utm_source: {{utm_source}}
- utm_medium: {{utm_medium}}
- utm_campaign: {{utm_campaign}}

Triggering: ConversionLandingPage Custom Event
```

## 🎯 Example dataLayer Events

### PageView
```javascript
dataLayer.push({
  event: 'page_view',
  eventName: 'PageView',
  eventType: 'PageView',
  page: '/financiamientos',
  url: 'https://trefa.mx/financiamientos',
  utm_source: 'google',
  utm_medium: 'cpc',
  timestamp: '2025-11-12T10:30:00.000Z'
});
```

### ConversionLandingPage
```javascript
dataLayer.push({
  event: 'conversion_landing_page',
  eventName: 'Conversion Landing Page',
  eventType: 'ConversionLandingPage',
  page: '/financiamientos',
  status: 'completed',
  utm_source: 'google',
  timestamp: '2025-11-12T10:30:00.000Z'
});
```

## 🔍 Testing & Debugging

### Test in GTM Preview Mode:
1. In GTM, click **Preview**
2. Enter: https://trefa.mx
3. Navigate and trigger events
4. Verify events fire in GTM Preview window

### Check Browser Console:
Open DevTools (F12) → Console, look for:
- ✅ GTM Event: [event name]
- ✅ Facebook Pixel Event: [event type]
- ✅ Saved to tracking_events

### View All dataLayer Events:
```javascript
console.log(window.dataLayer);
```

## 📊 View Data in Dashboard

Visit: https://trefa.mx/escritorio/admin/marketing-analytics

The "Embudo" tab will show:
1. Visitas Landing - PageView to /financiamientos
2. Registro - ConversionLandingPage events
3. Perfil Completo - PersonalInformationComplete  
4. Aplicación Iniciada - Application page views
5. Solicitud Enviada - LeadComplete events

All events are automatically saved to Supabase `tracking_events` table!
