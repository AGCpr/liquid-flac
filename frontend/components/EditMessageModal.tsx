import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Message } from '../types';
import { db } from '../services/db';
import { useAuth } from '../context/AuthContext';

interface EditMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  onMessageUpdated: (updatedMessage: Message) => void;
}

const EditMessageModal: React.FC<EditMessageModalProps> = ({ isOpen, onClose, message, onMessageUpdated }) => {
  const [text, setText] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (message) {
      setText(message.text);
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message && user) {
      try {
        const updatedMessage = await db.editMessage(message.id, user.id, text);
        onMessageUpdated(updatedMessage);
        onClose();
      } catch (error: any) {
        alert(error?.message || "Failed to update message. Please try again.");
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Message">
      <form onSubmit={handleSubmit}>
        <textarea 
          value={text} 
          onChange={e => setText(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white h-32" 
        />
        <div className="mt-6 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 text-white">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg bg-white text-black font-bold">Save</button>
        </div>
      </form>
    </Modal>
  );
};

export default EditMessageModal;
