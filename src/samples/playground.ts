const MODEL = `namespace hello@1.0.0
import org.accordproject.money@0.3.0.{MonetaryAmount} from https://models.accordproject.org/money@0.3.0.cto

concept Address {
    o String line1
    o String city
    o String state
    o String country
}

concept OrderLine {
    o String sku
    o Integer quantity
    o Double price
}

concept Order {
    o DateTime createdAt
    o OrderLine[] orderLines
}

@template
concept TemplateData {
    o String name
    o Address address
    o Integer age optional
    o MonetaryAmount salary
    o String[] favoriteColors
    o Order order
}`;

const TEMPLATE = `### Welcome {{name}}!

![AP Logo](https://avatars.githubusercontent.com/u/29445438?s=64)

{{#clause address}}  
#### Address
> {{line1}},  
 {{city}}, {{state}},  
 {{country}}  
 {{/clause}}

- You are *{{age}}* years old
- Your monthly salary is {{salary as "0,0.00 CCC"}}
- Your favorite colours are {{#join favoriteColors}}

{{#clause order}}
## Orders
Your last order was placed {{createdAt as "D MMMM YYYY"}} ({{% return now.diff(order.createdAt, 'day')%}} days ago).

{{#ulist orderLines}}
- {{quantity}}x _{{sku}}_ @ £{{price as "0,0.00"}}
{{/ulist}}
Order total: {{% return '£' + order.orderLines.map(ol => ol.price * ol.quantity).reduce((sum, cur) => sum + cur).toFixed(2);%}}
{{/clause}}

Thank you.
`;

const DATA = {
    "$class" : "hello@1.0.0.TemplateData",
    "name": "John Doe",
    "address" : {
        "line1" : "1 Main Street",
        "city" : "Boson",
        "state" : "MA",
        "country" : "USA"
    },
    "age" : 42,
    "salary": {
        "$class": "org.accordproject.money@0.3.0.MonetaryAmount",
        "doubleValue": 1500,
        "currencyCode": "EUR"
    },
    "favoriteColors" : ['red', 'green', 'blue'],
    "order" : {
        "createdAt" : "2023-05-01",
        "$class" : "hello@1.0.0.Order",
        "orderLines":
        [
        {
            "$class" : "hello@1.0.0.OrderLine",
            "sku" : "ABC-123",
            "quantity" : 3,
            "price" : 29.99
        },
        {
            "$class" : "hello@1.0.0.OrderLine",
            "sku" : "DEF-456",
            "quantity" : 5,
            "price" : 19.99
        }
    ]
    }
};

const NAME = 'Customer Order';
export {NAME, MODEL,DATA,TEMPLATE};