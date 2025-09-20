import { Button, Container, Form, InputGroup, Dropdown } from "react-bootstrap";
import { useRef, useState } from "react";
import ConfirmationModal from "../ConfirmationModal";

type PromptInputProps = {
  sendMessage: () => Promise<void>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  selectedImage: File | null;
  setSelectedImage: React.Dispatch<React.SetStateAction<File | null>>;
  onNewConversation: () => void;
};

const PromptInput: React.FC<PromptInputProps> = ({
  sendMessage,
  message,
  setMessage,
  loading,
  selectedImage,
  setSelectedImage,
  onNewConversation,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/bmp",
        "image/tiff",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, WebP, BMP, TIFF)");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      setSelectedImage(file);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleNewConversation = () => {
    setShowConfirmModal(true);
  };

  const confirmNewConversation = () => {
    onNewConversation();
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-3 p-3 rounded bg-neutral-700">
            <div className="d-flex justify-content-between align-items-center mb-2 text-white">
              <small className="text-muted !text-white">Selected Image:</small>
              <Button variant="danger" size="sm" onClick={handleImageRemove}>
                Remove
              </Button>
            </div>
            <div className="text-center">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Preview"
                style={{
                  maxHeight: "200px",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
                className="rounded"
              />
              <div className="mt-2">
                <small className="text-muted !text-white">
                  {selectedImage.name} (
                  {(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                </small>
              </div>
            </div>
          </div>
        )}

        <InputGroup className="mb-4">
          <Dropdown>
            <Dropdown.Toggle
              variant="light"
              disabled={loading}
              className="plus-btn d-flex align-items-center justify-content-center"
              style={{
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                borderTopRightRadius: '0',
                borderBottomRightRadius: '0',
                minWidth: '40px',
                padding: '0.375rem 0.5rem',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleUploadClick} className="d-flex align-items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                Upload Image
              </Dropdown.Item>
              <Dropdown.Item onClick={handleNewConversation} className="d-flex align-items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                New Conversation
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp,image/tiff"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
          <Form.Control
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            aria-label="input-prompt"
            aria-describedby="input-button"
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || (!message.trim() && !selectedImage)}
            variant="light"
            id="input-button"
            className="send-btn"
            style={{
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              if (!loading && (message.trim() || selectedImage)) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
                e.currentTarget.style.backgroundColor = '#d1d5db';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = '';
            }}
          >
            {loading ? "..." : "Send"}
          </Button>
        </InputGroup>
      </Form>

      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmNewConversation}
        title="Start New Conversation"
        message="Are you sure you want to start a new conversation? This will clear your current chat history and cannot be undone."
        confirmText="Start New Chat"
        cancelText="Keep Current Chat"
      />
    </Container>
  );
};

export default PromptInput;
