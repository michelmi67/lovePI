import React from 'react';

function Donate() {
  const sendDonation = async () => {
    try {
      await window.Pi.createPayment({
        amount: 1.0,
        memo: "Don pour soutenir PiLove",
        metadata: { type: "donation" },
        onReadyForServerApproval: paymentId => {
          fetch("http://localhost:3001/approve_donation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId })
          });
        },
        onReadyForServerCompletion: paymentId => {
          fetch("http://localhost:3001/complete_donation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId })
          });
        },
        onCancel: () => console.log("Don annulé"),
        onError: error => console.error("Erreur de don :", error),
      });
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={sendDonation}>Faire un don en Pi 💰</button>;
}

export default Donate;