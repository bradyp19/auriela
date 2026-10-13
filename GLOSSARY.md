# Aurelia travel

Aurelia helps travelers arrange their own travel through messaging. The first journey covers a flight request, an approved offer, a confirmed booking, and a departure reminder.

## Language

**Traveler**:
A person arranging their own business or leisure travel, with saved travel preferences.
_Avoid_: Corporate travel administrator

**Flight request**:
A traveler's request to find a flight that fits their intended journey and preferences. A request alone does not authorize a purchase.
_Avoid_: Booking

**Flight offer**:
A specific flight itinerary with a total price and cancellation terms, presented for the traveler's approval.
_Avoid_: Confirmed booking

**Travel preference**:
A traveler's favored choice that guides recommendations but permits alternatives. Inferred preferences remain soft, explainable, and correctable; only an explicit traveler instruction makes one a requirement.
_Avoid_: Travel requirement

**Travel requirement**:
An explicit constraint an offer must satisfy to qualify for the traveler's request. Relaxing a requirement requires the traveler's agreement.
_Avoid_: Travel preference

**Booking approval**:
A traveler's permission to purchase the specific itinerary at the total price and cancellation terms presented to them. A changed itinerary, price, or cancellation terms requires fresh approval.
_Avoid_: Standing purchase authority

**Booking attempt**:
An effort to purchase an approved flight offer. Its outcome may still be uncertain; an attempt is not a confirmed booking.
_Avoid_: Confirmed booking

**Confirmed booking**:
A flight reservation whose successful completion has been confirmed, rather than an offer or an attempt to purchase it.
_Avoid_: Flight request, flight offer

**Departure reminder**:
A message that helps a traveler prepare to depart for a confirmed flight.
_Avoid_: Fare monitoring
