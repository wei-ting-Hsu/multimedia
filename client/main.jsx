const { useState } = React;

const defaultEmailTemplate = {
  subject: '【{{activityName}}】報名成功通知',
  body: '親愛的 {{name}} 您好：\n\n感謝您報名本次活動！\n您已成功報名的場次為：{{session}}\n\n期待與您見面！\n— 活動小組'
};

const emptySession = { name: '', capacity: 50 };

function App() {
  const [activityName, setActivityName] = useState('科技講座');
  const [sessions, setSessions] = useState([
    { name: '場次A', capacity: 2 },
    { name: '場次B', capacity: 2 },
    { name: '場次C', capacity: 2 }
  ]);
  const [emailTemplate, setEmailTemplate] = useState(defaultEmailTemplate);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAddSession = () => {
    setSessions(prev => [...prev, { ...emptySession }]);
  };

  const handleRemoveSession = index => {
    setSessions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSessionChange = (index, key, value) => {
    setSessions(prev =>
      prev.map((session, idx) =>
        idx === index
          ? {
              ...session,
              [key]: key === 'capacity' ? Number(value) : value
            }
          : session
      )
    );
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:4000/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityName,
          sessions,
          emailTemplate
        })
      });

      if (!response.ok) {
        throw new Error('建立表單時發生錯誤，請稍後再試。');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>自動建立 Google 報名表單</h1>
      <form onSubmit={handleSubmit}>
        <section>
          <label htmlFor="activityName">活動名稱</label>
          <input
            id="activityName"
            value={activityName}
            onChange={event => setActivityName(event.target.value)}
            required
          />
        </section>

        <fieldset>
          <legend>場次設定</legend>
          {sessions.map((session, index) => (
            <div className="session-row" key={index}>
              <div>
                <label>場次名稱</label>
                <input
                  value={session.name}
                  onChange={event => handleSessionChange(index, 'name', event.target.value)}
                  required
                />
              </div>
              <div>
                <label>人數上限</label>
                <input
                  type="number"
                  min="1"
                  value={session.capacity}
                  onChange={event => handleSessionChange(index, 'capacity', event.target.value)}
                  required
                />
              </div>
              {sessions.length > 1 && (
                <button type="button" onClick={() => handleRemoveSession(index)}>
                  移除
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddSession}>
            + 新增場次
          </button>
        </fieldset>

        <fieldset>
          <legend>自動回信內容</legend>
          <div>
            <label htmlFor="emailSubject">郵件標題</label>
            <input
              id="emailSubject"
              value={emailTemplate.subject}
              onChange={event => setEmailTemplate(prev => ({ ...prev, subject: event.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="emailBody">郵件內容</label>
            <textarea
              id="emailBody"
              rows="6"
              value={emailTemplate.body}
              onChange={event => setEmailTemplate(prev => ({ ...prev, body: event.target.value }))}
              required
            />
          </div>
          <small>
            提示：可使用 {{'{{activityName}}'}}、{{'{{name}}'}}、{{'{{session}}'}}、{{'{{email}}'}} 等占位符插入活動名稱、填表人姓名、選擇場次與 Email。
          </small>
        </fieldset>

        <button type="submit" disabled={loading}>
          {loading ? '建立中…' : '建立表單'}
        </button>

        {error && <div className="error-card">{error}</div>}
        {result && (
          <div className="result-card">
            <p>表單建立完成！</p>
            <p>
              報名連結：
              <a href={result.formUrl} target="_blank" rel="noreferrer">
                {result.formUrl}
              </a>
            </p>
            <p>
              回應試算表：
              <a href={result.sheetUrl} target="_blank" rel="noreferrer">
                {result.sheetUrl}
              </a>
            </p>
          </div>
        )}
      </form>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
