export interface TransformerBlockData {
  id: string;
  label: string;
  type: 'input' | 'layer' | 'mechanism' | 'output';
  description?: string;
  position: [number, number, number];
  color: string;
  dimensions: [number, number, number];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export type ArchitecturePart = 
  | 'input-embedding' 
  | 'positional-encoding' 
  | 'multi-head-attention' 
  | 'add-norm' 
  | 'feed-forward' 
  | 'masked-attention' 
  | 'cross-attention' 
  | 'linear' 
  | 'softmax';