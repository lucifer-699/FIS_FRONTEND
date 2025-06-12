import React, { useState } from 'react';
import '../components/SmsModel.css';
import { sendSms } from '../api/api';

interface SmsModalProps {
  smsText: string;
  mobileList: string[];
  flightId: string;
  onClose: () => void;
}

const SmsModal: React.FC<SmsModalProps> = ({ smsText, mobileList, flightId, onClose }) => {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleConfirmSend = async () => {
    if (!flightId) {
      setError("Flight ID is missing. Cannot send SMS.");
      return;
    }

    console.log("Sending SMS for flight ID:", flightId); // ✅ Confirming flightId

    setSending(true);
    try {
      const result = await sendSms(flightId);
      setSuccess(`SMS sent successfully: ${result}`);
      setConfirming(false);
    } catch (err: any) {
      console.error("Send SMS error:", err);
      setError(`Failed to send SMS: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Send SMS</h2>

        <p><strong>Message:</strong></p>
        <div className="sms-text-box">
          {smsText || "No message available"}
        </div>

        <p><strong>Mobile Numbers:</strong></p>
        <div className="sms-mobile-list">
          {mobileList.map((number, idx) => (
            <div key={idx}>{number}</div>
          ))}
        </div>

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}

        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>Close</button>
          {!success && (
            <button className="submit-button" onClick={() => setConfirming(true)}>Send</button>
          )}
        </div>

        {confirming && (
          <div className="confirm-modal">
            <div className="confirm-content">
              <p>Are you sure you want to send the SMS?</p>
              <div className="confirm-actions">
                <button onClick={handleConfirmSend} disabled={sending}>
                  {sending ? "Sending..." : "Yes"}
                </button>
                <button onClick={() => setConfirming(false)}>No</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmsModal;
