export function HazardStatusCard({ title, status, icon: Icon, lastUpdate }) {
  const getStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case "warning":
        return {
          wrapper: "border-yellow-200 bg-white shadow-sm",
          iconBg: "bg-orange-50",
          iconColor: "text-orange-400",
          statusText: "text-orange-500",
          dot: "bg-orange-500"
        };
      case "critical":
        return {
          wrapper: "border-red-100 bg-white shadow-sm",
          iconBg: "bg-red-50",
          iconColor: "text-red-500",
          statusText: "text-red-600",
          dot: "bg-red-500"
        };
      case "safe":
        return {
          wrapper: "border-green-200 bg-white shadow-sm",
          iconBg: "bg-green-50",
          iconColor: "text-green-500",
          statusText: "text-green-600",
          dot: "bg-green-500"
        };
      default:
        return {
          wrapper: "border-gray-200 bg-white shadow-sm",
          iconBg: "bg-gray-50",
          iconColor: "text-gray-400",
          statusText: "text-gray-500",
          dot: "bg-gray-500"
        };
    }
  };

  const styles = getStatusStyles(status);

  return (
    <div className={`p-6 rounded-2xl border ${styles.wrapper}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${styles.iconBg}`}>
          <Icon className={styles.iconColor} size={24} />
        </div>
        <div className={`flex items-center gap-2 text-sm font-medium ${styles.statusText}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
          {status}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-xs text-gray-400">Last update: {lastUpdate}</p>
      </div>
    </div>
  );
}
