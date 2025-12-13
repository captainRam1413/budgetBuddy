import { StyleSheet, Text, View } from "react-native";
import React from "react";
import tailwind from "twrnc";
import { FlatList } from "react-native";
import ExpenceItemCard from "../components/ExpenceItemCard";
import EmptyList from "../components/EmptyList";
import { useExpense } from "../context/ExpenseContext";

export const transactions = [
  {
    id: 1,
    icon: "🍔", // food
    title: "Lunch at Cafe",
    category: "Food",
    date: "2025-09-20",
    amount: 250,
    color: "#FF6B6B", // reddish
  },
  {
    id: 2,
    icon: "🚌", // transport
    title: "Bus Ticket",
    category: "Transport",
    date: "2025-09-19",
    amount: 50,
    color: "#4ECDC4", // teal
  },
  {
    id: 3,
    icon: "🎬", // entertainment
    title: "Movie Night",
    category: "Entertainment",
    date: "2025-09-18",
    amount: 400,
    color: "#FFD93D", // yellow
  },
  {
    id: 4,
    icon: "🛒", // shopping
    title: "Grocery Shopping",
    category: "Shopping",
    date: "2025-09-17",
    amount: 1200,
    color: "#6BCB77", // green
  },
  {
    id: 5,
    icon: "💡", // utilities
    title: "Electricity Bill",
    category: "Utilities",
    date: "2025-09-15",
    amount: 1800,
    color: "#4D96FF", // blue
  },
];

// const[expensList,setList] = React.useState(transactions);

const Home = ({ navigation }) => {
  const { expenses } = useExpense();
  const totalSpent = transactions.reduce(
    (total, item) => total + item.amount,
    0,
  );
  return (
    <View style={tailwind`flex-1`}>
      {/* <Text>Home</Text> */}

      <View style={tailwind`px-5 py-3 `}>
        <Text style={tailwind`text-4xl font-bold text-black`}>Hi 👋</Text>
        <Text style={tailwind`text-base text-gray-500 mt-1`}>
          Start tracking your expenses easily!...{" "}
        </Text>
      </View>

      <View
        style={tailwind`bg-black border border-black rounded-3xl mx-5 my-5 p-6 items-center shadow-lg`}
      >
        <Text style={tailwind`text-base text-gray-400`}>Spent so far</Text>
        <Text style={tailwind`text-base text-white text-4xl mt-2 font-bold`}>
          ${totalSpent.toFixed(2)}
        </Text>
      </View>

      <FlatList
        data={expenses}
        // data={[]}
        renderItem={({ item }) => <ExpenceItemCard item={item} />}
        KeyExtractor={(item) => item}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<EmptyList />}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({});
