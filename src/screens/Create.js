import { ScrollView, StyleSheet, Text, View, TextInput, Pressable, Alert } from 'react-native'
import React from 'react'
import tailwind from 'twrnc'
// import { TextInput } from 'react-native/types_generated/index'



const Create = ({navigation, route}) => {
  const [amount, setAmount] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState({});
 
  React.useEffect(() => {
    if (route.params?.item) {
      const { item } = route.params;
      console.log("Selected category:", item);
      setCategory(route.params?.item);
    }
  }, [route.params?.item]);

  const handleExpense = () => {
    if (!amount || !title || !category.name) {
      console.log("all fields are required");
      Alert.alert("all fields are required");
      return;
    }
    console.log("Expense added:", { amount, title, categoryName: category.name });
    Alert.alert("Expense added: ", `${title} - $${amount} in ${category.name}`);
  }

  const handleCategoryInput = () => {
    console.log("Category input pressed");
    navigation.navigate("Category");
  }

  return (
    <View>
      <ScrollView contentContainerStyle={tailwind`p-6`}>
        {/* Header section */}
        <Text style={tailwind`text-3xl font-bold text-black`}>Create new Expense</Text>
        <Text style={tailwind`text-base mt-2 mb-8 text-gray-500`}>Enter the details of your expense to help you track your spending.</Text>

        {/* Expense form section */}
        <View style={tailwind`mb-6`}>
          <Text style={tailwind`text-lg font-semibold text-gray-700 mb-2`}>Enter Amount</Text>
          <TextInput 
            placeholder="$0.00" 
            style={tailwind`border-2 border-gray-300 p-4 rounded-xl text-lg`} 
            value={amount}
            onChangeText={setAmount}
          />
          {/* <TextInput placeholder="Description" style={tailwind`border-2 border-blue-500 p-4 rounded-xl mt-4 text-lg`} /> */}
        </View>


        <View style={tailwind`mb-6`}>
          <Text style={tailwind`text-lg font-semibold text-gray-700 mb-2`}>Title</Text>
          <TextInput 
            placeholder="Enter Title" 
            style={tailwind`border-2 border-gray-300 p-4 rounded-xl text-lg`} 
            value={title}
            onChangeText={setTitle}
            />
        </View>

        <View style={tailwind`mb-6`}>
          <Text style={tailwind`text-lg font-semibold text-gray-700 mb-2`}>Category</Text>

          <Pressable 
          onPress={handleCategoryInput}
          style={tailwind`border border-gray-300 p-4 rounded-xl flex-row justify-between items-center`}>
            
            <View style={tailwind`flex-row  items-center `}>
              <Text style={tailwind`text-2xl mr-3 `}>{category.icon || '🍔'}</Text>
              <Text style={tailwind`text-lg`}>{category.name || 'Food'}</Text>
            </View>
            <Text style={tailwind`text-lg`}>&gt;</Text>
          </Pressable>

        </View>
        
        {/* Footer section */}

        <Pressable
         style={tailwind`bg-black p-6 rounded-lg mt-8`}
         onPress={handleExpense}
       >
         <Text style={tailwind`text-white text-lg font-bold text-center`}>Add Expense</Text>
       </Pressable>
      </ScrollView>
    </View>
  )
}

export default Create

const styles = StyleSheet.create({})