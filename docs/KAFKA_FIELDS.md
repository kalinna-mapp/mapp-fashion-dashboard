# Mapp Data Stream — Kafka Field Reference

## Connection Setup

```python
# backend/kafka_consumer.py
kafka_config = {
    'bootstrap.servers': 'YOUR_KAFKA_HOST:PORT',     # from Mapp Connection Info
    'group.id':          'fashion-dashboard-consumer',
    'auto.offset.reset': 'latest',
    'security.protocol': 'SASL_SSL',
    'sasl.mechanism':    'SCRAM-SHA-256',
    'sasl.username':     'YOUR_USERNAME',
    'sasl.password':     'YOUR_PASSWORD',
}
```

**Supported formats:** JSON or AVRO
Set the format in **Mapp Intelligence → Data Streams → Edit Stream → Delivery Format**.

**Connection info location:** Mapp Intelligence → Data Streams → [your stream] → Connection Information icon

---

## Event Schemas

### Page View Event
```json
{
  "eventType": "page",
  "sessionId": "abc123",
  "userId": "u456",
  "timestamp": "2025-03-18T14:32:01Z",
  "contentGroup": "dresses",
  "productName": "Summer Dress Lina",
  "productCategory": "Dresses",
  "productCost": 79.99,
  "deviceType": "mobile",
  "country": "DE",
  "browser": "Chrome"
}
```

### Basket Event (Add to Cart)
```json
{
  "eventType": "basket",
  "basketStatus": "add",
  "sessionId": "abc123",
  "userId": "u456",
  "timestamp": "2025-03-18T14:33:15Z",
  "productName": "Summer Dress Lina",
  "productCategory": "Dresses",
  "productCost": 79.99,
  "basketValue": 159.98,
  "basketItems": 2,
  "productQuantity": 2
}
```

### Order Event (Purchase Confirmed)
```json
{
  "eventType": "order",
  "orderStatus": "conf",
  "sessionId": "abc123",
  "userId": "u456",
  "timestamp": "2025-03-18T14:38:02Z",
  "productName": "Summer Dress Lina",
  "productCategory": "Dresses",
  "orderValue": 159.98,
  "basketItems": 2
}
```

---

## Dashboard Field Mapping

| Dashboard Display | Kafka Field | Event Type(s) |
|-------------------|-------------|--------------|
| Product Name | `productName` | basket, order |
| Product Category | `productCategory` | all |
| Unit Price (view lane) | `productCost` | page |
| Cart Total | `basketValue` | basket |
| Order Total | `orderValue` | order |
| Cart Item Count | `basketItems` | basket, order |
| Active Session | `sessionId` | all |
| User Identity | `userId` | all |
| Device Type | `deviceType` | page |
| Country | `country` | page |
| Browser | `browser` | page |

---

## AVRO Format

If using AVRO format, install the required packages:

```bash
pip install fastavro confluent-kafka[avro]
```

The AVRO schema is available in:
**Mapp Intelligence → Data Streams → [your stream] → Avro Format**

---

## Notes

> Field names may differ depending on your Mapp Intelligence account configuration
> and which custom parameters have been set up in your tracking implementation.
> Verify field names with your Mapp Customer Success Manager or check the
> Data Streams documentation at docs.mapp.com.
