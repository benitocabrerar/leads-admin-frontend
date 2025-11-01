/**
 * Telegram Chat Component
 * Displays chat messages and allows sending messages to leads via Telegram
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatSessionsApi, chatMessagesApi, telegramApi } from '@/lib/api';
import {
  ChatSession,
  ChatMessage,
  MessageSender,
  MessageType,
  SessionStatus,
  SessionChannel,
} from '@/lib/types';
import { useAuth } from '@/lib/store/auth';

interface TelegramChatProps {
  leadId: number;
  leadName: string;
  telegramUsername?: string;
  telegramUserId?: string;
}

export function TelegramChat({
  leadId,
  leadName,
  telegramUsername,
  telegramUserId,
}: TelegramChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch active sessions for this lead
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions', 'lead', leadId, 'active'],
    queryFn: () => chatSessionsApi.getActiveSessionsByLead(leadId),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch Telegram bot status
  const { data: botStatus } = useQuery({
    queryKey: ['telegram-status'],
    queryFn: () => telegramApi.getBotStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get the active Telegram session
  const activeSession = sessionsData?.items.find(
    (s) => s.channel === SessionChannel.TELEGRAM && s.status === SessionStatus.ACTIVE
  );

  // Fetch messages for active session
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', 'session', activeSessionId],
    queryFn: () =>
      activeSessionId
        ? chatMessagesApi.getMessagesBySession(activeSessionId)
        : Promise.resolve({ total: 0, page: 1, page_size: 100, items: [] }),
    enabled: !!activeSessionId,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Update active session ID when sessions change
  useEffect(() => {
    if (activeSession) {
      setActiveSessionId(activeSession.id);
    }
  }, [activeSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.items]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (activeSessionId && messagesData?.items.length) {
      const unreadMessages = messagesData.items.filter(
        (m) => !m.is_read && m.sender_type === MessageSender.LEAD
      );

      if (unreadMessages.length > 0) {
        chatMessagesApi.markSessionMessagesAsRead(activeSessionId).catch(console.error);
      }
    }
  }, [activeSessionId, messagesData?.items]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await telegramApi.sendMessage(leadId, content);
    },
    onSuccess: () => {
      setMessage('');
      // Refetch messages to show the sent message
      queryClient.invalidateQueries({ queryKey: ['chat-messages', 'session', activeSessionId] });
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessageMutation.mutateAsync(message.trim());
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Get sender display info
  const getSenderInfo = (msg: ChatMessage) => {
    switch (msg.sender_type) {
      case MessageSender.LEAD:
        return {
          name: msg.sender_name || leadName,
          color: 'bg-blue-100 text-blue-800',
          align: 'justify-start',
        };
      case MessageSender.AGENT:
        return {
          name: msg.sender_name || user?.name || 'Agent',
          color: 'bg-green-100 text-green-800',
          align: 'justify-end',
        };
      case MessageSender.BOT:
        return {
          name: 'Bot',
          color: 'bg-purple-100 text-purple-800',
          align: 'justify-start',
        };
      case MessageSender.SYSTEM:
        return {
          name: 'System',
          color: 'bg-gray-100 text-gray-800',
          align: 'justify-center',
        };
      default:
        return {
          name: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
          align: 'justify-start',
        };
    }
  };

  // No Telegram connection
  if (!telegramUsername && !telegramUserId) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Telegram Connection</h3>
          <p className="mt-1 text-sm text-gray-500">
            This lead has not connected via Telegram yet.
          </p>
        </div>
      </div>
    );
  }

  // Bot not running
  if (botStatus && botStatus.status !== 'running') {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Telegram Bot Offline</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>The Telegram bot is currently not running. Chat functionality is unavailable.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
              </svg>
            </div>
            <div className="text-white">
              <h2 className="text-lg font-semibold">Telegram Chat</h2>
              <p className="text-sm text-indigo-200">
                {telegramUsername ? `@${telegramUsername}` : 'Connected via Telegram'}
              </p>
            </div>
          </div>
          {botStatus && (
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex h-3 w-3 rounded-full ${
                  botStatus.status === 'running' && botStatus.ready
                    ? 'bg-green-400'
                    : 'bg-yellow-400'
                }`}
              ></span>
              <span className="text-sm text-white">
                {botStatus.status === 'running' && botStatus.ready ? 'Online' : 'Connecting'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {sessionsLoading || messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : !activeSession ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No active chat session</p>
          </div>
        ) : messagesData?.items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messagesData?.items.map((msg) => {
              const senderInfo = getSenderInfo(msg);
              const isAgent = msg.sender_type === MessageSender.AGENT;
              const isSystem = msg.sender_type === MessageSender.SYSTEM;

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-gray-200 rounded-full px-4 py-1 text-xs text-gray-600">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${senderInfo.align}`}>
                  <div className={`max-w-xs lg:max-w-md ${isAgent ? 'order-2' : ''}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isAgent ? 'bg-indigo-600 text-white' : 'bg-white'
                      } shadow`}
                    >
                      {!isAgent && (
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          {senderInfo.name}
                        </p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <div
                        className={`flex items-center justify-end space-x-1 mt-1 ${
                          isAgent ? 'text-indigo-200' : 'text-gray-500'
                        }`}
                      >
                        <span className="text-xs">{formatTime(msg.created_at)}</span>
                        {msg.is_read && isAgent && (
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 px-4 py-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={sendMessageMutation.isPending || !activeSession}
          />
          <button
            type="submit"
            disabled={
              !message.trim() || sendMessageMutation.isPending || !activeSession
            }
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {sendMessageMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </form>
        {sendMessageMutation.isError && (
          <p className="mt-2 text-sm text-red-600">
            Failed to send message. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
