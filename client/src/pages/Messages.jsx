import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  Package,
  Clock,
  CheckCheck,
  Star,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import RatingModal from '../components/common/RatingModal';

export default function Messages() {
  const { user } = useAuth();
  const { refreshUnreadMessages } = useNotifications();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeConvParam = queryParams.get('conversationId');
  const openRatingParam = queryParams.get('openRating') === 'true';

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(activeConvParam || null);
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Rating Modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(openRatingParam);
  const [markingSold, setMarkingSold] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Fetch conversations
  const fetchConversations = async () => {
    try {
      const data = await api.get('/messages/conversations');
      if (data.success) {
        setConversations(data.conversations || []);

        // Default to first conversation if none selected
        if (!activeConvId && data.conversations?.length > 0) {
          setActiveConvId(data.conversations[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch messages for active conversation
  const fetchActiveMessages = async (convId) => {
    if (!convId) return;
    try {
      const data = await api.get(`/messages/${convId}`);
      if (data.success) {
        setMessages(data.messages || []);
        refreshUnreadMessages();
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    fetchActiveMessages(activeConvId).finally(() => setLoadingMsgs(false));

    // Polling for live chat updates
    const interval = setInterval(() => {
      fetchActiveMessages(activeConvId);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newText.trim() || !activeConvId) return;

    const textToSend = newText.trim();
    setNewText('');
    setSending(true);

    try {
      const res = await api.post(`/messages/${activeConvId}`, { text: textToSend });
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        fetchConversations();
      }
    } catch (err) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find((c) => c._id === activeConvId);
  const otherParticipant = activeConversation?.participants?.find(
    (p) => p._id !== user?._id
  );

  const listing = activeConversation?.listingId;
  const isSeller = user && listing && (listing.sellerId?._id === user._id || listing.sellerId === user._id);
  const isSold = listing?.status === 'sold';

  // Seller Action: Mark as Sold & Request Buyer Rating
  const handleMarkAsSold = async () => {
    if (!listing?._id || !activeConvId) return;

    const confirmMsg = `Mark "${listing.title}" as SOLD to ${otherParticipant?.firstName || 'this buyer'} and send a review request?`;
    if (!window.confirm(confirmMsg)) return;

    setMarkingSold(true);
    try {
      const res = await api.post(`/listings/${listing._id}/mark-sold-request-rating`, {
        conversationId: activeConvId,
        buyerId: otherParticipant?._id
      });

      if (res.success) {
        alert(`Success! "${listing.title}" has been marked as SOLD and removed from the marketplace catalog.`);
        fetchConversations();
        fetchActiveMessages(activeConvId);
      }
    } catch (err) {
      alert(err.message || 'Failed to mark item as sold.');
    } finally {
      setMarkingSold(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden h-[75vh] flex flex-col md:flex-row">
        
        {/* Left: Conversation List (1/3) */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-safegreen-600" />
              <span>Messages</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct communication with buyers & sellers
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConvs ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active conversations yet. Visit any product listing and click "Message Seller".
              </div>
            ) : (
              conversations.map((conv) => {
                const other = conv.participants?.find((p) => p._id !== user?._id) || {};
                const isActive = conv._id === activeConvId;

                return (
                  <div
                    key={conv._id}
                    onClick={() => setActiveConvId(conv._id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-emerald-50/80 border-l-4 border-safegreen-600'
                        : 'hover:bg-slate-100/70 bg-white'
                    }`}
                  >
                    {other.profileImage ? (
                      <img
                        src={other.profileImage}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-safegreen-100 text-safegreen-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {other.firstName ? other.firstName[0].toUpperCase() : 'U'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {other.firstName} {other.lastName}
                        </h4>
                        {conv.lastMessage?.createdAt && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(conv.lastMessage.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>

                      {conv.listingId?.title && (
                        <span className="text-[11px] font-semibold text-safegreen-700 truncate block mt-0.5">
                          🏷️ {conv.listingId.title} {conv.listingId.status === 'sold' ? '(SOLD)' : ''}
                        </span>
                      )}

                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessage?.text || 'No messages yet'}
                      </p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-safegreen-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Area (2/3) */}
        <div className="flex-1 flex flex-col h-full bg-white">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white z-10">
                <div className="flex items-center gap-3">
                  {otherParticipant?.profileImage ? (
                    <img
                      src={otherParticipant.profileImage}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-safegreen-100 text-safegreen-800 flex items-center justify-center font-bold text-xs">
                      {otherParticipant?.firstName ? otherParticipant.firstName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {otherParticipant?.firstName} {otherParticipant?.lastName}
                    </h3>
                    <span className="text-xs text-slate-400">@{otherParticipant?.username}</span>
                  </div>
                </div>

                {/* Right side actions in header */}
                <div className="flex items-center gap-2">
                  {listing && (
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                      <Package className="w-4 h-4 text-safegreen-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-800 max-w-[150px] sm:max-w-[200px] truncate">
                        {listing.title}
                      </span>
                      <span className="font-bold text-safegreen-800">
                        ₱{listing.price?.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Seller Action Button: Mark as Sold & Request Rating */}
                  {isSeller && !isSold && (
                    <button
                      type="button"
                      onClick={handleMarkAsSold}
                      disabled={markingSold}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{markingSold ? 'Updating...' : 'Mark Sold & Request Rating'}</span>
                    </button>
                  )}

                  {isSeller && isSold && (
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                      ✅ Marked as SOLD
                    </span>
                  )}

                  {/* Buyer Action Button: Rate Seller */}
                  {!isSeller && (
                    <button
                      type="button"
                      onClick={() => setRatingModalOpen(true)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Star className="w-4 h-4 fill-amber-300" />
                      <span>Rate Seller</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Transaction / Rating Request Banner for Buyer */}
              {!isSeller && isSold && (
                <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500 flex-shrink-0" />
                    <span>
                      Seller marked <strong>"{listing?.title}"</strong> as <strong>SOLD</strong> to you! Please leave a review for <strong>{otherParticipant?.firstName}</strong>.
                    </span>
                  </div>
                  <button
                    onClick={() => setRatingModalOpen(true)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs flex-shrink-0"
                  >
                    Rate Seller Now ⭐
                  </button>
                </div>
              )}

              {/* Safety notice in chat */}
              <div className="bg-amber-50/80 px-4 py-2 border-b border-amber-200 text-center text-xs text-amber-800 font-medium">
                ⚠️ SafeMarket Reminder: Never send reservation deposits or wire transfers in chat. Complete peer-to-peer inspection in public.
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                {loadingMsgs ? (
                  <div className="text-center text-xs text-slate-400 py-6">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-12">
                    Say hello to initiate your peer-to-peer conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                    const isSystemRatingMsg = msg.text && msg.text.includes('TRANSACTION COMPLETED');

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                            isSystemRatingMsg
                              ? 'bg-amber-100 text-amber-950 border border-amber-300 rounded-xl'
                              : isMe
                              ? 'bg-safegreen-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          
                          {/* If system rating request message and reader is buyer, show button right inside message */}
                          {isSystemRatingMsg && !isSeller && (
                            <button
                              onClick={() => setRatingModalOpen(true)}
                              className="mt-2 w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <Star className="w-4 h-4 fill-amber-300" />
                              <span>Click Here to Rate {otherParticipant?.firstName}</span>
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Type a message (e.g. Can we meet at Trinoma on Saturday?)..."
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-safegreen-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newText.trim()}
                  className="px-4 py-2.5 bg-safegreen-600 hover:bg-safegreen-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No Conversation Selected</h4>
              <p className="text-xs text-slate-500 mt-1">
                Choose a conversation from the left or message a seller from any listing.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        sellerId={otherParticipant?._id}
        sellerName={`${otherParticipant?.firstName || ''} ${otherParticipant?.lastName || ''}`}
        listingId={listing?._id}
        onRatingSuccess={() => {
          fetchConversations();
          fetchActiveMessages(activeConvId);
        }}
      />
    </div>
  );
}
