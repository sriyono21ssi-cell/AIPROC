
import React, { useState, useRef, useEffect } from 'react';
import type { Vendor, PricedItem, Message, NewVendor, NewPricedItem, ComparisonProject, ComparisonVendor } from '../types';
import { createChatSession } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { ClipboardIcon } from './icons/ClipboardIcon';

interface ChatAdminProps {
  vendors: Vendor[];
  pricedItems: PricedItem[];
  projects: ComparisonProject[];
  messages: Message[];
  addMessage: (message: Message) => void;
  resetChat: () => void;
  // Action functions
  addVendor: (vendor: NewVendor) => void;
  addItem: (item: NewPricedItem) => void;
  updateItemPrice: (itemId: string, newPrice: number, vendorId: string) => void;
  addProject: (project: Omit<ComparisonProject, 'id' | 'vendors' | 'createdAt'>) => void;
  addVendorToProject: (projectId: string, vendor: Omit<ComparisonVendor, 'id'>) => void;
}

const ChatAdmin: React.FC<ChatAdminProps> = (props) => {
  const { vendors, pricedItems, projects, messages, addMessage, resetChat, addVendor, addItem, updateItemPrice, addProject, addVendorToProject } = props;
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSession.current) {
      chatSession.current = createChatSession();
    }
  }, []);
  
  useEffect(() => {
    if(chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleReset = () => {
    if (window.confirm("Yakin ingin mereset percakapan ini?")) {
        resetChat();
        chatSession.current = createChatSession();
    }
  }

  const handleCopy = () => {
    if (isCopied) return;

    const chatText = messages
      .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`)
      .join('\n\n');

    navigator.clipboard.writeText(chatText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Gagal menyalin percakapan.');
    });
  };

  const handleAction = (action: string, data: any) => {
    let confirmationMessage = "Waduh, sepertinya ada yang salah. 😥";
    try {
        switch (action) {
            case 'ADD_VENDOR':
                addVendor(data as NewVendor);
                confirmationMessage = `Sip, vendor baru "${data.name}" sudah berhasil saya tambahkan! 👍`;
                break;
            case 'ADD_PRICED_ITEM': {
                const vendor = vendors.find(v => v.name.toLowerCase() === data.vendorName.toLowerCase());
                if (vendor) {
                    addItem({ ...data, vendorId: vendor.id });
                    confirmationMessage = `Oke, barang "${data.name}" dengan harga awal Rp ${data.initialPrice} sudah masuk daftar harga. ✅`;
                } else {
                    confirmationMessage = `Maaf, saya tidak bisa menemukan vendor bernama "${data.vendorName}". Pastikan namanya benar ya.`;
                }
                break;
            }
            case 'UPDATE_ITEM_PRICE': {
                const item = pricedItems.find(i => i.name.toLowerCase() === data.itemName.toLowerCase());
                const vendor = vendors.find(v => v.name.toLowerCase() === data.vendorName.toLowerCase());
                if (item && vendor) {
                    updateItemPrice(item.id, data.newPrice, vendor.id);
                    confirmationMessage = `Harga untuk "${data.itemName}" berhasil diupdate menjadi Rp ${data.newPrice}! 📈`;
                } else {
                    confirmationMessage = `Maaf, saya tidak bisa menemukan barang "${data.itemName}" atau vendor "${data.vendorName}".`;
                }
                break;
            }
            case 'ADD_PROJECT': {
                addProject({ ...data, weights: { price: 40, leadTime: 20, warranty: 20, paymentTerms: 20 } });
                confirmationMessage = `Proyek perbandingan baru "${data.name}" sudah dibuat. Semangat! 💪`;
                break;
            }
            case 'ADD_VENDOR_TO_PROJECT': {
                const project = projects.find(p => p.name.toLowerCase() === data.projectName.toLowerCase());
                if (project) {
                    const { projectName, vendorName, ...vendorData } = data;
                    addVendorToProject(project.id, { name: vendorName, ...vendorData });
                    confirmationMessage = `Vendor "${vendorName}" sudah ditambahkan ke proyek "${data.projectName}".`;
                } else {
                    confirmationMessage = `Maaf, saya tidak menemukan proyek bernama "${data.projectName}".`;
                }
                break;
            }
            default:
                confirmationMessage = `Maaf, saya belum mengerti tindakan "${action}".`;
        }
    } catch (e) {
        console.error("Error executing action:", action, e);
        confirmationMessage = "Aduh, terjadi kesalahan teknis saat memproses permintaanmu. Coba lagi ya.";
    }
    addMessage({ sender: 'ai', text: confirmationMessage });
  };

  const handleSend = async () => {
    if (!input.trim() || !chatSession.current) return;
    const userInput = input;
    setInput('');
    addMessage({ sender: 'user', text: userInput });
    setIsLoading(true);

    try {
      const vendorContext = `Data Vendor Saat Ini:\n${JSON.stringify(vendors.map(v => ({id: v.id, name: v.name, category: v.category, status: v.status})))}`;
      const pricingContext = `Data Harga Barang Saat Ini:\n${JSON.stringify(pricedItems.map(p => ({id: p.id, name: p.name, lastPrice: p.lastPrice, lastVendorName: p.lastVendorName, history: p.history})))}`;
      const projectContext = `Data Proyek Perbandingan Saat Ini:\n${JSON.stringify(projects.map(p => ({id: p.id, name: p.name, description: p.description})))}`;
      
      const fullPrompt = `Berikut adalah data yang relevan untuk membantumu menjawab pertanyaan:\n\n${vendorContext}\n\n${pricingContext}\n\n${projectContext}\n\n---\n\nPertanyaan User: ${userInput}`;
      
      const response = await chatSession.current.sendMessage({ message: fullPrompt });
      const aiResponse = response.text.trim();
      
      // Check if response is a JSON action
      if (aiResponse.startsWith('{') && aiResponse.endsWith('}')) {
        try {
            const jsonData = JSON.parse(aiResponse);
            if (jsonData.action && jsonData.data) {
                handleAction(jsonData.action, jsonData.data);
            } else {
                addMessage({ sender: 'ai', text: aiResponse }); // It's JSON but not a valid action
            }
        } catch (error) {
            addMessage({ sender: 'ai', text: aiResponse }); // Parsing failed, treat as normal text
        }
      } else {
        addMessage({ sender: 'ai', text: aiResponse }); // Not JSON, treat as normal text
      }

    } catch (error) {
      console.error("Chat error:", error);
      addMessage({ sender: 'ai', text: "Aduh, maaf, koneksi saya lagi kurang baik nih. Bisa coba tanya lagi nanti? 🙏" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        {/* Title removed as per request */}
        <div/>
        <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              disabled={isCopied}
              className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2 disabled:bg-gray-400"
            >
              <ClipboardIcon className="w-5 h-5" />
              <span>{isCopied ? 'Tersalin!' : 'Salin'}</span>
            </button>
            <button
              onClick={handleReset}
              className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
            >
              Reset Percakapan
            </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
        <div ref={chatContainerRef} className="flex-1 p-6 space-y-4 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-base-200 text-gray-800'}`}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-base-200 text-gray-800">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-base-200 bg-white">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Ketik pesanmu di sini..."
              className="flex-1 px-4 py-2 border border-gray-300 bg-base-200 text-neutral rounded-full focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-primary text-white rounded-full p-3 hover:bg-primary-focus disabled:bg-gray-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAdmin;
