import { DEFAULT_CATEGORIES } from "./constant";

export const getId = () => {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
};

export const getDate = () => {
    return new Date().toISOString().split('T')[0];
};

export const getCategoryColor = (color) => {
    // If it's already a hex color, return it directly
    if (color && (color.startsWith('#') || color.startsWith('rgb'))) {
        return color;
    }
    // Otherwise try to look up by category name
    const category = DEFAULT_CATEGORIES.find(cat => cat.name === color);
    return category ? category.color : '#808080'; // default to gray if not found
}

// Format date and time in a readable way
export const formatDateTime = (dateString) => {
    if (!dateString) return 'Today';
    
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Format time (e.g., "2:30 PM")
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    const timeStr = `${displayHours}:${displayMinutes} ${ampm}`;
    
    // Check if it's today
    if (transactionDate.getTime() === today.getTime()) {
        return `Today, ${timeStr}`;
    }
    
    // Check if it's yesterday
    if (transactionDate.getTime() === yesterday.getTime()) {
        return `Yesterday, ${timeStr}`;
    }
    
    // Check if it's within the last 7 days
    const diffTime = today - transactionDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7 && diffDays > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
    }
    
    // For older dates
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = date.getFullYear();
    const currentYear = now.getFullYear();
    
    // Show year only if it's not the current year
    if (year !== currentYear) {
        return `${monthNames[date.getMonth()]} ${date.getDate()}, ${year}`;
    }
    
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}