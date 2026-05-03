import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getBookingMessages, sendBookingMessage } from '../services/bookings';

const messageDateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const BookingChatPanel = ({ booking, viewerType, viewerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const disabledReason = useMemo(() => {
    if (!viewerId) {
      return 'Sign in again to open the booking chat.';
    }

    if (!booking?.userId) {
      return 'This booking is not linked to a customer account yet.';
    }

    if (!booking?.workerId) {
      return 'Chat will open once a worker is assigned to this booking.';
    }

    if (booking?.status === 'cancelled') {
      return 'Chat is unavailable because this booking was cancelled.';
    }

    return '';
  }, [booking?.status, booking?.userId, booking?.workerId, viewerId]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      return undefined;
    }

    if (disabledReason) {
      setMessages([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    let isActive = true;

    const loadMessages = async ({ isInitialLoad = false } = {}) => {
      if (isInitialLoad) {
        setLoading(true);
      }

      try {
        const nextMessages = await getBookingMessages(booking.id, viewerType, viewerId);

        if (!isActive) {
          return;
        }

        setMessages(nextMessages);
        setError('');
      } catch (nextError) {
        if (!isActive) {
          return;
        }

        setError(nextError.message || 'Unable to load the booking chat right now.');
      } finally {
        if (isActive && isInitialLoad) {
          setLoading(false);
        }
      }
    };

    void loadMessages({ isInitialLoad: true });
    const pollId = window.setInterval(() => {
      void loadMessages();
    }, 4000);

    return () => {
      isActive = false;
      window.clearInterval(pollId);
    };
  }, [booking.id, disabledReason, isOpen, viewerId, viewerType]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedDraft = draft.trim();

    if (!trimmedDraft || disabledReason) {
      return;
    }

    setSending(true);

    try {
      const createdMessage = await sendBookingMessage(booking.id, {
        actorType: viewerType,
        actorId: viewerId,
        message: trimmedDraft,
      });

      setMessages((currentMessages) => [...currentMessages, createdMessage]);
      setDraft('');
      setError('');
    } catch (nextError) {
      setError(nextError.message || 'Unable to send your message right now.');
    } finally {
      setSending(false);
    }
  };

  const getSenderLabel = (senderType) => {
    if (senderType === viewerType) {
      return 'You';
    }

    if (senderType === 'worker') {
      return booking.workerName || 'Worker';
    }

    return booking.customerName || 'Customer';
  };

  return (
    <section className="booking-chat-panel">
      <div className="booking-chat-header">
        <div>
          <p className="booking-chat-title">{viewerType === 'worker' ? 'Customer chat' : 'Worker chat'}</p>
          <p className="booking-chat-copy">
            {viewerType === 'worker'
              ? 'Reply to the customer assigned to this booking.'
              : 'Message the worker assigned to this booking.'}
          </p>
        </div>
        <button type="button" className="btn-outline booking-chat-toggle" onClick={() => setIsOpen((currentState) => !currentState)}>
          {isOpen ? 'Hide Chat' : 'Open Chat'}
        </button>
      </div>

      {!isOpen ? (
        <div className="workers-empty-state booking-chat-empty" style={{ marginBottom: 0 }}>
          Open chat only when you need it for a smoother dashboard.
        </div>
      ) : null}

      {isOpen && disabledReason ? (
        <div className="workers-empty-state booking-chat-empty" style={{ marginBottom: 0 }}>
          {disabledReason}
        </div>
      ) : null}

      {isOpen && !disabledReason && loading ? (
        <div className="workers-empty-state booking-chat-empty" style={{ marginBottom: 0 }}>
          Loading chat...
        </div>
      ) : null}

      {isOpen && !disabledReason && !loading && error ? (
        <div className="workers-feedback" role="alert" style={{ marginBottom: 0 }}>
          {error}
        </div>
      ) : null}

      {isOpen && !disabledReason && !loading && !error ? (
        <>
          <div className="booking-chat-thread">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isOwnMessage = message.senderType === viewerType;

                return (
                  <article
                    key={message.id}
                    className={`booking-chat-message${isOwnMessage ? ' is-own' : ''}`}
                  >
                    <div className="booking-chat-message-meta">
                      <span>{getSenderLabel(message.senderType)}</span>
                      <span>{messageDateFormatter.format(new Date(message.createdAt))}</span>
                    </div>
                    <p className="booking-chat-message-copy">{message.message}</p>
                  </article>
                );
              })
            ) : (
              <div className="workers-empty-state booking-chat-empty" style={{ marginBottom: 0 }}>
                No messages yet. Start the conversation here.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="booking-chat-form" onSubmit={handleSubmit}>
            <label className="booking-field">
              <span>Message</span>
              <textarea
                name="message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  viewerType === 'worker'
                    ? 'Share an update with your customer'
                    : 'Ask the worker about timing, location, or details'
                }
                rows={3}
              />
            </label>

            <button type="submit" className="btn-primary booking-chat-submit" disabled={sending || !draft.trim()}>
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </>
      ) : null}
    </section>
  );
};

export default BookingChatPanel;
