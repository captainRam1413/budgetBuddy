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