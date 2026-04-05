import ChatView from './ChatView';

interface QrViewProps {
  questionContent?: string;
  isStreamingQuestion?: boolean;
  correctionContent?: string;
  isStreamingCorrection?: boolean;
  onSubmitAnswer?: (answer: string) => void;
  text: string;
  subject: string;
}

export default function QrView({
  text,
  subject,
}: QrViewProps) {
  // Le nouveau ChatView remplace complètement le Q&R ancien
  return (
    <ChatView
      text={text}
      subject={subject}
      onMessagesSent={(messages) => {
        // Callback optionnel pour tracker l'historique
      }}
    />
  );
}
