export interface ShoppableItem {
  id: string;
  name: string;
  category: string;
  price: string;
  brand: string;
  description: string;
  link: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string; // Optional new base64 image generated after refinement
  timestamp: string;
  items?: ShoppableItem[];
}

export interface DesignStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  iconName: string; // Lucide icon name string
}

export interface RoomPreset {
  id: string;
  name: string;
  description: string;
  originalImage: string;
  styleImages: Record<string, string>; // Maps style.id -> image URL or base64
  shoppableItems: Record<string, ShoppableItem[]>; // Maps style.id -> shoppable items
}
