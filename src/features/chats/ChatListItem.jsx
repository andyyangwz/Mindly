import './styles/index.css';

export function ChatListItem({ chat, isActive, onClick }) {
  return (
    <div
      className={`chat-list-item${isActive ? ' active' : ''}`}
      onClick={() => onClick(chat.id)}
    >
      <img
        className="chat-list-item__avatar"
        src={chat.avatar}
        alt={chat.name}
      />
      <div className="chat-list-item__content">
        <div className="chat-list-item__name">{chat.name}</div>
        <div className="chat-list-item__last-message">
          {chat.lastMessage}
        </div>
      </div>
      <span className="chat-list-item__time">{chat.time}</span>
    </div>
  );
}
