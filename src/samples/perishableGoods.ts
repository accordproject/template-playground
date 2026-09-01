export const NAME = 'Perishable Goods (with Logic)';

export const MODEL = `namespace org.accordproject.perishablegoods@0.2.0

import org.accordproject.contract@0.2.0.Contract from https://models.accordproject.org/accordproject/contract@0.2.0.cto
import org.accordproject.runtime@0.2.0.{Request,Response,State,Obligation} from https://models.accordproject.org/accordproject/runtime@0.2.0.cto
import org.accordproject.money@0.3.0.MonetaryAmount from https://models.accordproject.org/money@0.3.0.cto

/**
 * Units of mass
 */
enum UnitOfMass {
  o KG
  o TONNE
  o LB
}

/**
 * A sensor reading (temperature and humidity)
 */
concept SensorReading {
  o Double centigrade
  o Double humidity
}

/**
 * Request: shipment received with unit count and embedded sensor readings
 */
transaction ShipmentReceived extends Request {
  o String shipmentId
  o Integer unitCount
  o SensorReading[] sensorReadings
}

/**
 * Response: price calculation result
 */
transaction PriceCalculation extends Response {
  o Double totalPrice
  o Double penalty
  o String currencyCode
  o Boolean late
}

/**
 * Event emitted when payment is due
 */
event PerishableGoodsPaymentEvent extends Obligation {
  o Double totalPrice
  o String currencyCode
  o String description
}

/**
 * State for the perishable goods contract
 */
asset PerishableGoodsState extends State {
  o Boolean payoutMade default=false
  o Double totalPaid default=0.0
}

/**
 * The template model
 */
@template
asset TemplateModel extends Contract {
  o String grower
  o String importer
  o String shipmentId
  o DateTime dueDate
  o UnitOfMass unit
  o Integer minUnits
  o Integer maxUnits
  o String product
  o Integer sensorReadingFrequency
  o String duration
  o MonetaryAmount unitPrice
  o Double minTemperature
  o Double maxTemperature
  o Double minHumidity
  o Double maxHumidity
  o Double penaltyFactor
}
`;

export const TEMPLATE = `Perishable Goods
----
On receipt of the shipment {{shipmentId}} the importer {{importer}} pays the grower {{grower}} {{unitPrice}} per {{unit}}. The shipment must contain between {{minUnits}} and {{maxUnits}} {{unit}} of {{product}}.

Shipping containers used must be temperature and humidity controlled, and sensor readings must be logged at least {{sensorReadingFrequency}} per {{duration}}.

Shipments that arrive after {{dueDate}} are to be considered spoiled and must be arranged to be returned to or disposed of by grower at cost to grower. A late shipment is priced at zero and incurs no penalty, and none of the temperature, humidity, or penalty rules below are evaluated for it: lateness is checked first, and if the shipment is late, calculation stops there.

Temperature readings for the shipment must be between {{minTemperature}} and {{maxTemperature}}.

Humidity readings for the shipment must be between {{minHumidity}} and {{maxHumidity}}.

Shipments that have a temperature or humidity reading outside the agreed range have a price penalty applied calculated using the Formula for Breach Penalty Calculation below. The breach penalty factor to be used is {{penaltyFactor}}.

Calculation of the amount owed for a shipment must be performed in the following order, on every trigger of the contract, using only the sensor readings and unit count submitted with that shipment:

1. Lateness check. Compare the shipment's arrival time to {{dueDate}}. If the shipment arrived on or after {{dueDate}}, the shipment is late: set totalPrice to 0 and penalty to 0, do not evaluate steps 2 through 6, and go directly to the State Update rule below.

2. Determine the worst temperature and humidity readings. Across all sensor readings in the shipment, find the single lowest centigrade value and the single highest centigrade value, and separately find the single lowest humidity value and the single highest humidity value. Do not evaluate each reading individually and do not average the readings — only these four extreme values (temp low, temp high, humidity low, humidity high) matter. 

3. Calculate the temperature penalty per unit, checking "too cold" before "too high" and stopping at the first match:
   - If the lowest reading is below {{minTemperature}}, the temperature penalty per unit is ({{minTemperature}} minus the lowest reading) multiplied by {{penaltyFactor}}.
   - Otherwise, if the highest reading is above {{maxTemperature}}, the temperature penalty per unit is (the highest reading minus {{maxTemperature}}) multiplied by {{penaltyFactor}}.
   - Otherwise, the temperature penalty per unit is 0.
   - Only one of these three outcomes applies per shipment, even if readings exist on both sides of the range.

4. Calculate the humidity penalty per unit, checking "too dry" before "too humid" and stopping at the first match:
   - If the lowest reading is below {{minHumidity}}, the humidity penalty per unit is ({{minHumidity}} minus the lowest reading) multiplied by {{penaltyFactor}}.
   - Otherwise, if the highest reading is above {{maxHumidity}}, the humidity penalty per unit is (the highest reading minus {{maxHumidity}}) multiplied by {{penaltyFactor}}.
   - Otherwise, the humidity penalty per unit is 0.
   - Only one of these three outcomes applies per shipment, even if readings exist on both sides of the range.
   
5. Calculate the total penalty for the shipment:
   - totalPenaltyPerUnit = temperaturePenaltyPerUnit + humidityPenaltyPerUnit. Both values from steps 3 and 4 are always included in this sum, even when one of them is 0 , never substitute one for the other, never average them, never use only whichever one is larger, and never derive one from the other (for example, by doubling or scaling one category's penalty to stand in for the other). Each of the two values must come only from its own independent calculation in step 3 or step 4, using its own readings and its own bounds.
   - totalPenalty = totalPenaltyPerUnit multiplied by the number of units received in this shipment.

6. Calculate totalPrice for the shipment:
   - Base payout = {{unitPrice}} multiplied by the number of units received in this shipment.
   - totalPrice = base payout minus the total penalty for the shipment, floored at 0 (totalPrice can never be negative, no matter how large the penalty is).

State Update rule:
   - The contract state holds only two values: payoutMade and totalPaid.
   - The penalty and the base payout are never stored in state; they exist only in the result of the current trigger and are not remembered afterward.
   - totalPaid in the new state must equal totalPaid from the incoming state PLUS the totalPrice just calculated in step 6 (or 0, if the shipment was late). This is a running, cumulative total across every shipment ever triggered under this contract , never reset it, never overwrite it, and never replace it with just the current shipment's totalPrice.`;

export const DATA = {
  "$class": "org.accordproject.perishablegoods@0.2.0.TemplateModel",
  "grower": "PETER",
  "importer": "DAN",
  "shipmentId": "SHIP_001",
  "dueDate": "2018-07-02T00:00:00.000Z",
  "unit": "KG",
  "minUnits": 3000,
  "maxUnits": 3500,
  "product": "Grade I, Size 4, Zutano Mexican Avocados",
  "sensorReadingFrequency": 1,
  "duration": "hours",
  "unitPrice": {
    "$class": "org.accordproject.money@0.3.0.MonetaryAmount",
    "doubleValue": 1.5,
    "currencyCode": "USD"
  },
  "minTemperature": 2.0,
  "maxTemperature": 13.0,
  "minHumidity": 70.0,
  "maxHumidity": 90.0,
  "penaltyFactor": 0.2,
  "$identifier": "46467b65-22e0-40cc-900a-0f75dcc366f4",
  "contractId": "46467b65-22e0-40cc-900a-0f75dcc366f4"
};

export const REQUEST = {
    "$class": "org.accordproject.perishablegoods@0.2.0.ShipmentReceived",
    "$identifier": "req-1",
    "$timestamp": "2018-06-25T08:00:00.000Z",
    "shipmentId": "SHIP_001",
    "unitCount": 3000,
    "sensorReadings": [
      {
        "$class": "org.accordproject.perishablegoods@0.2.0.SensorReading",
        "centigrade": 5,
        "humidity": 80
      },
      {
        "$class": "org.accordproject.perishablegoods@0.2.0.SensorReading",
        "centigrade": 10,
        "humidity": 85
      }
    ]
};

export const LOGIC = `import {
    IShipmentReceived,
    IPriceCalculation,
    IPerishableGoodsPaymentEvent,
    IPerishableGoodsState,
    ITemplateModel,
    ISensorReading,
} from "./org.accordproject.perishablegoods@0.2.0";

interface PerishableGoodsResponse extends EngineResponse<IPerishableGoodsState> {
    result: IPriceCalculation;
}

// @ts-ignore TemplateLogic is imported by the runtime
class PerishableGoodsLogic extends TemplateLogic<ITemplateModel, IPerishableGoodsState> {

    async init(data: ITemplateModel): Promise<InitResponse<IPerishableGoodsState>> {
        return {
            state: {
                $class: "org.accordproject.perishablegoods@0.2.0.PerishableGoodsState",
                $identifier: data.$identifier,
                payoutMade: false,
                totalPaid: 0.0,
            }
        };
    }

    /**
     * Calculate the temperature-based penalty from sensor readings.
     * If any reading falls below minTemperature, apply penalty based on the deviation.
     * If any reading exceeds maxTemperature, apply penalty based on the deviation.
     */
    private calculateTempPenalty(
        minTemp: number,
        maxTemp: number,
        penaltyFactor: number,
        readings: ISensorReading[]
    ): number {
        const temps = readings.map((r) => r.centigrade);
        const lowestReading = Math.min(...temps);
        const highestReading = Math.max(...temps);

        if (lowestReading < minTemp) {
            return (minTemp - lowestReading) * penaltyFactor;
        } else if (highestReading > maxTemp) {
            return (highestReading - maxTemp) * penaltyFactor;
        }
        return 0.0;
    }

    /**
     * Calculate the humidity-based penalty from sensor readings.
     */
    private calculateHumPenalty(
        minHumidity: number,
        maxHumidity: number,
        penaltyFactor: number,
        readings: ISensorReading[]
    ): number {
        const humidities = readings.map((r) => r.humidity);
        const lowestReading = Math.min(...humidities);
        const highestReading = Math.max(...humidities);

        if (lowestReading < minHumidity) {
            return (minHumidity - lowestReading) * penaltyFactor;
        } else if (highestReading > maxHumidity) {
            return (highestReading - maxHumidity) * penaltyFactor;
        }
        return 0.0;
    }

    async trigger(
        data: ITemplateModel,
        request: IShipmentReceived,
        state: IPerishableGoodsState
    ): Promise<PerishableGoodsResponse> {
        // Guard: unit count must be within the contract-specified bounds
        if (request.unitCount < data.minUnits || request.unitCount > data.maxUnits) {
            throw new Error("Units received out of range for the contract");
        }

        const currency = data.unitPrice.currencyCode;

        // Guard: check if the shipment is late. The contract keys this to when the
        // shipment *arrives*, so compare the request's own timestamp against the due
        // date. Using the wall clock instead would make the outcome depend on when
        // the contract happens to be executed rather than on the facts of the shipment.
        // NOTE: keep this file ASCII-only - the engine base64-encodes the compiled
        // logic with btoa(), which throws on any character outside Latin-1.
        const arrival = request.$timestamp ? new Date(request.$timestamp) : new Date();
        const dueDate = new Date(data.dueDate);

        if (arrival >= dueDate) {
            // Shipment is spoiled and returned at the grower's cost: nothing is
            // owed, so no payout is made and the state carries forward untouched.
            const lateResult: IPriceCalculation = {
                $class: "org.accordproject.perishablegoods@0.2.0.PriceCalculation",
                $timestamp: arrival,
                totalPrice: 0.0,
                penalty: 0.0,
                currencyCode: currency,
                late: true,
            };
            return { result: lateResult, state: { ...state }, events: [] };
        }

        // Guard: must have sensor readings
        const readings = request.sensorReadings ?? [];
        if (readings.length === 0) {
            throw new Error("No temperature readings received");
        }

        // Calculate base payout
        const payOut = data.unitPrice.doubleValue * request.unitCount;

        // Calculate penalties
        const tempPenalty = this.calculateTempPenalty(
            data.minTemperature,
            data.maxTemperature,
            data.penaltyFactor,
            readings
        );
        const humPenalty = this.calculateHumPenalty(
            data.minHumidity,
            data.maxHumidity,
            data.penaltyFactor,
            readings
        );

        const totalPenaltyPerUnit = tempPenalty + humPenalty;
        const totalPenalty = totalPenaltyPerUnit * request.unitCount;
        const totalPrice = Math.max(payOut - totalPenalty, 0.0);

        const event: IPerishableGoodsPaymentEvent = {
            $class: "org.accordproject.perishablegoods@0.2.0.PerishableGoodsPaymentEvent",
            $timestamp: arrival,
            $identifier: data.contractId + "-payment",
            // An Obligation carries a back-reference to the governing contract. The
            // generated type models it as the target interface, but the wire format
            // of a Concerto relationship is the identifier string, which is also
            // what the engine fills in when the logic leaves this unset.
            contract: data.contractId as unknown as IContract,
            totalPrice,
            currencyCode: currency,
            description: data.importer + " should pay shipment amount to " + data.grower,
        };

        const result: IPriceCalculation = {
            $class: "org.accordproject.perishablegoods@0.2.0.PriceCalculation",
            $timestamp: arrival,
            totalPrice,
            penalty: totalPenalty,
            currencyCode: currency,
            late: false,
        };

        const newState: IPerishableGoodsState = {
            $class: "org.accordproject.perishablegoods@0.2.0.PerishableGoodsState",
            $identifier: state.$identifier,
            payoutMade: true,
            totalPaid: state.totalPaid + totalPrice,
        };

        return { result, state: newState, events: [event] };
    }
}

export default PerishableGoodsLogic;
`;
