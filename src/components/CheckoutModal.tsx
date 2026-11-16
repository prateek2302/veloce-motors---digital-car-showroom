import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  Smartphone,
  X,
} from 'lucide-react';
import { SHOWROOM_LOCATIONS } from '../data/vehicles';
import { createReservation, type ReservationRecord } from '../lib/firebase';
import {
  detectCardBrand,
  formatCardNumber,
  formatCurrency,
  formatExpiry,
  generateTransactionReference,
  passesLuhnCheck,
  validateExpiry,
} from '../lib/payment';
import type { VehicleConfiguration } from './ConfiguratorSection';

interface CheckoutModalProps {
  config: VehicleConfiguration;
  user: User;
  onClose: () => void;
  onSuccess: (reservation: ReservationRecord) => void;
}

type PaymentMethod = 'card' | 'wire' | 'apple_pay';

export function CheckoutModal({
  config,
  user,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [customerName, setCustomerName] = useState(user.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(user.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showroomLocation, setShowroomLocation] = useState<string>(
    SHOWROOM_LOCATIONS[0]
  );

  // Card inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [billingZip, setBillingZip] = useState('');

  // Wire inputs
  const [bankName, setBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountLast4, setAccountLast4] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] =
    useState<ReservationRecord | null>(null);

  const cardBrand = detectCardBrand(cardNumber);

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (customerName.trim().length < 2) {
      setError('Please enter your full legal name for title registration.');
      return;
    }
    if (!customerEmail.includes('@')) {
      setError('Please provide a valid email address for receipt delivery.');
      return;
    }
    if (customerPhone.replace(/\D/g, '').length < 7) {
      setError('Please enter a valid phone number for delivery coordination.');
      return;
    }

    let last4 = '0000';
    if (paymentMethod === 'card') {
      if (!passesLuhnCheck(cardNumber)) {
        setError('Please enter a valid credit or debit card number.');
        return;
      }
      if (!validateExpiry(cardExpiry)) {
        setError('Please enter a valid future card expiration date (MM/YY).');
        return;
      }
      if (cardCvc.replace(/\D/g, '').length < 3) {
        setError('Please enter the 3 or 4 digit security code.');
        return;
      }
      if (billingZip.trim().length < 4) {
        setError('Please enter your billing postal code.');
        return;
      }
      last4 = cardNumber.replace(/\D/g, '').slice(-4);
    } else if (paymentMethod === 'wire') {
      if (bankName.trim().length < 2) {
        setError('Please enter your issuing bank name.');
        return;
      }
      if (routingNumber.replace(/\D/g, '').length !== 9) {
        setError('Please enter a valid 9-digit bank routing number.');
        return;
      }
      if (accountLast4.replace(/\D/g, '').length !== 4) {
        setError('Please enter the last 4 digits of your funding account.');
        return;
      }
      last4 = accountLast4.replace(/\D/g, '').slice(-4);
    } else {
      last4 = 'APAY';
    }

    setSubmitting(true);
    try {
      const txRef = generateTransactionReference();
      const record = await createReservation({
        userId: user.uid,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        vehicleId: config.vehicle.id,
        vehicleName: config.vehicle.name,
        trimName: config.trim.name,
        exteriorColor: config.exteriorColor.name,
        interiorFinish: config.interiorFinish.name,
        wheelPackage: config.wheelPackage.name,
        vehiclePrice: config.totalPrice,
        depositAmount: config.vehicle.depositAmount,
        paymentMethod,
        cardLast4: last4,
        transactionRef: txRef,
        paymentStatus: 'paid',
        reservationStatus: 'confirmed',
        showroomLocation,
        deliveryWindow: config.vehicle.deliveryEstimate,
      });
      setConfirmedOrder(record);
      onSuccess(record);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to authorize reservation deposit. Please verify your details.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Vehicle Reservation Checkout"
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-white text-[#141517] shadow-2xl border border-[#141517]/10 overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#141517]/10">
          <div>
            <p className="text-xs text-[#9A470A] font-medium">
              Encrypted Payment Authorization
            </p>
            <h2 className="font-display text-lg font-bold text-[#141517]">
              {confirmedOrder
                ? `Reservation Confirmed — ${confirmedOrder.transactionRef}`
                : `Reserve ${config.vehicle.name}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#141517]/60 hover:bg-[#141517]/5 hover:text-[#141517]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmedOrder ? (
          <div className="p-8 space-y-6">
            <div className="flex items-start gap-4 p-5 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-6 w-6 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-lg font-bold text-emerald-950">
                  Order #{confirmedOrder.transactionRef} Confirmed — Build Slot Reserved
                </h3>
                <p className="text-sm text-emerald-900/80 mt-1">
                  Your {formatCurrency(confirmedOrder.depositAmount)} refundable deposit has been authorized and recorded under {confirmedOrder.customerEmail}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-xl bg-[#F7F6F3] border border-[#141517]/10 text-sm">
              <div className="space-y-2">
                <p className="text-xs text-[#141517]/60">Vehicle Specification</p>
                <p className="font-semibold text-[#141517]">
                  {confirmedOrder.trimName}
                </p>
                <p className="text-[#141517]/75">
                  {confirmedOrder.exteriorColor} · {confirmedOrder.interiorFinish}
                </p>
                <p className="text-[#141517]/75">{confirmedOrder.wheelPackage}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-[#141517]/60">Payment & Delivery</p>
                <p className="font-mono font-semibold text-[#141517]">
                  Deposit Paid: {formatCurrency(confirmedOrder.depositAmount)} (
                  {confirmedOrder.paymentMethod.toUpperCase()} ·•••{' '}
                  {confirmedOrder.cardLast4})
                </p>
                <p className="text-[#141517]/75">
                  Total MSRP: {formatCurrency(confirmedOrder.vehiclePrice)}
                </p>
                <p className="text-[#141517]/75">
                  {confirmedOrder.showroomLocation} · Est.{' '}
                  {confirmedOrder.deliveryWindow}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-[#141517] text-sm font-semibold text-white hover:bg-[#27292D]"
              >
                Done & View in My Garage
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={validateAndSubmit}
            className="grid grid-cols-1 lg:grid-cols-12"
          >
            {/* Left Payment & Client Details */}
            <div className="lg:col-span-7 p-6 space-y-6">
              {/* Contact & Showroom */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#141517]">
                  1. Client & Delivery Showroom
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#141517]/70 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full rounded-lg border border-[#141517]/15 px-3.5 py-2.5 text-sm focus:border-[#141517] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#141517]/70 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 (415) 555-0192"
                      className="w-full rounded-lg border border-[#141517]/15 px-3.5 py-2.5 text-sm focus:border-[#141517] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#141517]/70 mb-1">
                      Receipt Email
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#141517]/15 px-3.5 py-2.5 text-sm focus:border-[#141517] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#141517]/70 mb-1">
                      Delivery Showroom
                    </label>
                    <select
                      value={showroomLocation}
                      onChange={(e) => setShowroomLocation(e.target.value)}
                      className="w-full rounded-lg border border-[#141517]/15 px-3.5 py-2.5 text-sm bg-white focus:border-[#141517] focus:outline-none"
                    >
                      {SHOWROOM_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div className="space-y-4 pt-4 border-t border-[#141517]/10">
                <h3 className="text-sm font-semibold text-[#141517]">
                  2. Deposit Payment Method
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-[#141517] bg-[#141517] text-white'
                        : 'border-[#141517]/15 text-[#141517]/75 hover:border-[#141517]/40'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wire')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      paymentMethod === 'wire'
                        ? 'border-[#141517] bg-[#141517] text-white'
                        : 'border-[#141517]/15 text-[#141517]/75 hover:border-[#141517]/40'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    Bank Wire
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('apple_pay')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      paymentMethod === 'apple_pay'
                        ? 'border-[#141517] bg-[#141517] text-white'
                        : 'border-[#141517]/15 text-[#141517]/75 hover:border-[#141517]/40'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    Express Pay
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    {/* Live Card Preview */}
                    <div className="rounded-xl bg-[#141517] text-white p-4 flex flex-col justify-between h-32">
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span>Veloce Escrow Authorization</span>
                        <span className="font-mono font-semibold text-[#F59E0B]">
                          {cardBrand}
                        </span>
                      </div>
                      <p className="font-mono text-base tracking-widest">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span className="truncate max-w-[180px]">
                          {customerName || 'CARDHOLDER'}
                        </span>
                        <span className="font-mono">{cardExpiry || 'MM/YY'}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#141517]/70 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(formatCardNumber(e.target.value))
                        }
                        placeholder="4532 0190 8821 4410"
                        className="w-full rounded-lg border border-[#141517]/15 px-3.5 py-2.5 font-mono text-sm focus:border-[#141517] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-[#141517]/70 mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardExpiry}
                          onChange={(e) =>
                            setCardExpiry(formatExpiry(e.target.value))
                          }
                          placeholder="08/29"
                          className="w-full rounded-lg border border-[#141517]/15 px-3.5 py-2.5 font-mono text-sm focus:border-[#141517] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#141517]/70 mb-1">
                          CVC
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) =>
                            setCardCvc(e.target.value.replace(/\D/g, ''))
                          }
                          placeholder="842"
                          className="w-full rounded-lg border border-[#141517]/15 px-3.5 py-2.5 font-mono text-sm focus:border-[#141517] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#141517]/70 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={billingZip}
                          onChange={(e) => setBillingZip(e.target.value)}
                          placeholder="94107"
                          className="w-full rounded-lg border border-[#141517]/15 px-3.5 py-2.5 font-mono text-sm focus:border-[#141517] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'wire' && (
                  <div className="space-y-3 p-4 rounded-xl bg-[#F7F6F3] border border-[#141517]/10">
                    <div>
                      <label className="block text-xs text-[#141517]/70 mb-1">
                        Issuing Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="First Republic Private Bank"
                        className="w-full rounded-lg border border-[#141517]/15 bg-white px-3.5 py-2.5 text-sm focus:border-[#141517] focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[#141517]/70 mb-1">
                          9-Digit Routing Number
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={9}
                          value={routingNumber}
                          onChange={(e) =>
                            setRoutingNumber(e.target.value.replace(/\D/g, ''))
                          }
                          placeholder="121000358"
                          className="w-full rounded-lg border border-[#141517]/15 bg-white px-3.5 py-2.5 font-mono text-sm focus:border-[#141517] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#141517]/70 mb-1">
                          Account Last 4 Digits
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={4}
                          value={accountLast4}
                          onChange={(e) =>
                            setAccountLast4(e.target.value.replace(/\D/g, ''))
                          }
                          placeholder="4910"
                          className="w-full rounded-lg border border-[#141517]/15 bg-white px-3.5 py-2.5 font-mono text-sm focus:border-[#141517] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'apple_pay' && (
                  <div className="p-4 rounded-xl bg-[#F7F6F3] border border-[#141517]/10 text-sm text-[#141517]/80">
                    Express Digital Wallet uses your verified Veloce client account token to authorize the {formatCurrency(config.vehicle.depositAmount)} refundable reservation deposit instantaneously.
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
                  >
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Right Order Summary */}
            <div className="lg:col-span-5 bg-[#F7F6F3] p-6 border-t lg:border-t-0 lg:border-l border-[#141517]/10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#141517]">
                  Build Summary
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#141517]/70">Model & Trim</span>
                    <span className="font-medium text-right">
                      {config.trim.name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#141517]/70">Exterior Finish</span>
                    <span className="font-medium text-right">
                      {config.exteriorColor.name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#141517]/70">Interior Cabin</span>
                    <span className="font-medium text-right">
                      {config.interiorFinish.name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#141517]/70">Wheels</span>
                    <span className="font-medium text-right">
                      {config.wheelPackage.name}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-[#141517]/10 flex justify-between gap-4">
                    <span className="text-[#141517]/70">Configured MSRP</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(config.totalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-base font-bold pt-2 border-t border-[#141517]/10">
                    <span>Refundable Deposit Due Today</span>
                    <span className="font-mono text-[#9A470A]">
                      {formatCurrency(config.vehicle.depositAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[48px] rounded-xl bg-[#B45309] hover:bg-[#9A470A] disabled:opacity-60 px-6 py-3.5 text-sm font-semibold text-white transition-colors"
                >
                  {submitting
                    ? 'Authorizing Deposit...'
                    : `Authorize ${formatCurrency(config.vehicle.depositAmount)} & Reserve`}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-[#141517]/60">
                  <Lock className="h-3.5 w-3.5" />
                  256-bit TLS · Deposit applies toward final purchase
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
