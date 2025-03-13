interface TestCase {
    input: string;
    output: string;
}

interface ParameterInfo {
    name: {
        type: string;
        required: boolean;
    };
    type: {
        type: string;
        required: boolean;
    };
}

export type FunctionInfo = {
    language: string;
    functionName: string;
    parameters: ParameterInfo[];
    returnType: string;
};

export default function javaTemplate(USER_CODE: string, TEST_CASES: TestCase[], functionMetadata: FunctionInfo): string {
    const testCasesCode = generateTestCasesCode(TEST_CASES);
    const simplifiedParams = functionMetadata.parameters.map(param => ({
        name: param.name.type,
        type: param.type.type
    }));

    const functionCallCode = generateFunctionCallCode({
        functionName: functionMetadata.functionName,
        parameters: simplifiedParams,
        returnType: functionMetadata.returnType
    });

    const resultComparisonCode = generateResultComparisonCode(functionMetadata.returnType);
    const conversionMethods = generateConversionMethods({
        functionName: functionMetadata.functionName,
        parameters: simplifiedParams,
        returnType: functionMetadata.returnType
    });

    const comparisonMethods = generateComparisonMethods(functionMetadata.returnType);

    return `import java.util.*;
import com.google.gson.*;
import java.io.*;

class Solution {
    // User's code will be injected here
    public ${functionMetadata.returnType} ${functionMetadata.functionName}(${generateParameterList(functionMetadata.parameters)}) {
        ${USER_CODE}
    }
}

public class SolutionRunner {
    private static final Gson gson = new GsonBuilder()
        .serializeNulls()
        .setPrettyPrinting()
        .create();

    public static void main(String[] args) {
        Solution solution = new Solution();
        List<TestCase> testCases = new ArrayList<>();

        // Add test cases
        ${testCasesCode}

        List<TestResult> results = new ArrayList<>();

        for (int i = 0; i < testCases.size(); i++) {
            TestCase tc = testCases.get(i);
            TestResult result = new TestResult(i + 1);

            try {
                // Convert input parameters and call the user function
                ${functionCallCode}

                // Compare results
                ${resultComparisonCode}
            } catch (Exception e) {
                result.status = "ERROR";
                result.message = e.getClass().getName() + ": " + e.getMessage();
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                result.stackTrace = sw.toString();
            }
            results.add(result);
        }

        // Output the results as JSON
        System.out.println(gson.toJson(results));
    }

    // Helper methods for conversion and comparison
    ${conversionMethods}
    
    ${comparisonMethods}

    // Helper classes
    static class TestCase {
        private Object[] input;
        private Object expected;

        TestCase(Object[] input, Object expected) {
            this.input = input;
            this.expected = expected;
        }

        public Object getInputAt(int index) {
            if (index >= 0 && index < input.length) {
                return input[index];
            }
            throw new IndexOutOfBoundsException("Invalid index: " + index);
        }

        public Object getExpected() {
            return expected;
        }
    }

    static class TestResult {
        int testCaseNumber;
        String status = "ERROR";
        String message = "";
        String stackTrace = "";

        TestResult(int num) {
            this.testCaseNumber = num;
        }
    }
}`;
}

// Helper function to generate parameter list for the function signature
function generateParameterList(parameters: ParameterInfo[]): string {
    return parameters.map(param => `${param.type.type} ${param.name.type}`).join(', ');
}

// Helper function to generate code for test cases
function generateTestCasesCode(testCases: TestCase[]): string {
    if (!testCases || testCases.length === 0) {
        return '// No test cases provided';
    }

    return testCases.map((tc, index) => {
        return `testCases.add(new TestCase(
            new Object[]{${formatInputs(tc.input)}}, 
            ${formatOutput(tc.output)}
        ));`;
    }).join('\n        ');
}

// Format input values for test cases
function formatInputs(input: string): string {
    try {
        let parsedInput = JSON.parse(input);
        if (Array.isArray(parsedInput)) {
            return parsedInput.map(formatValue).join(', ');
        } else {
            return formatValue(parsedInput);
        }
    } catch (e) {
        // If not valid JSON, treat as a string
        return `"${escapeString(input)}"`;
    }
}

// Format output value for test cases
function formatOutput(output: string): string {
    try {
        let parsedOutput = JSON.parse(output);
        return formatValue(parsedOutput);
    } catch (e) {
        // If not valid JSON, treat as a string
        return `"${escapeString(output)}"`;
    }
}

// Escape special characters in strings
function escapeString(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

// Format a single value for Java code
function formatValue(value: any): string {
    if (value === null) {
        return 'null';
    } else if (Array.isArray(value)) {
        if (value.length === 0) {
            return 'new Object[0]';
        }

        // Check if all elements are of the same type
        const firstType = typeof value[0];
        const allSameType = value.every(item => typeof item === firstType);

        if (allSameType && firstType === 'number') {
            // Check if all numbers are integers
            const allIntegers = value.every(num => Number.isInteger(num));
            if (allIntegers) {
                return `new int[]{${value.join(', ')}}`;
            } else {
                return `new double[]{${value.join(', ')}}`;
            }
        } else if (allSameType && firstType === 'string') {
            return `new String[]{${value.map(s => `"${escapeString(s)}"`).join(', ')}}`;
        } else if (allSameType && firstType === 'boolean') {
            return `new boolean[]{${value.join(', ')}}`;
        } else {
            return `new Object[]{${value.map(formatValue).join(', ')}}`;
        }
    } else if (typeof value === 'string') {
        return `"${escapeString(value)}"`;
    } else if (typeof value === 'number') {
        // Check if number is an integer
        if (Number.isInteger(value)) {
            return String(value);
        } else {
            return `${value}d`; // Explicit double for non-integer values
        }
    } else if (typeof value === 'boolean') {
        return String(value);
    } else {
        return 'gson.fromJson("' + JSON.stringify(value).replace(/"/g, '\\"') + '", Object.class)';
    }
}

// Generate code to call the user function with the correct parameter types
// Generate code to call the user function with the correct parameter types
function generateFunctionCallCode(functionInfo: { functionName: string; parameters: { name: string; type: string }[]; returnType: string }): string {
    const paramConversions = functionInfo.parameters.map((param, index) => {
        return `${param.type} ${param.name} = convert${getConverterSuffix(param.type)}(tc.getInputAt(${index}));`;
    }).join('\n                ');

    const paramNames = functionInfo.parameters.map(param => param.name).join(', ');

    return `${paramConversions}
                
                // Call the user function with correctly typed parameters
                ${functionInfo.returnType} received = solution.${functionInfo.functionName}(${paramNames});
                ${functionInfo.returnType} expected = convert${getConverterSuffix(functionInfo.returnType)}(tc.getExpected());`;
}

// Generate code to compare results based on the return type
function generateResultComparisonCode(returnType: string): string {
    const comparisonMethod = getComparisonMethod(returnType);

    return `boolean isEqual = ${comparisonMethod}(received, expected);

                if (isEqual) {
                    result.status = "PASSED";
                } else {
                    result.status = "FAILED";
                    result.message = "Expected: " + gson.toJson(expected) + ", Received: " + gson.toJson(received);
                }`;
}

// Generate all necessary conversion methods based on the function signature
function generateConversionMethods(functionInfo: { functionName: string; parameters: { name: string; type: string }[]; returnType: string }): string {
    const types = new Set<string>();

    // Add parameter types
    functionInfo.parameters.forEach(param => {
        types.add(param.type);
    });

    // Add return type
    types.add(functionInfo.returnType);

    const methods = Array.from(types).map(type => {
        return generateConversionMethod(type);
    });

    return methods.join('\n\n    ');
}

// Generate a specific conversion method for a type
function generateConversionMethod(type: string): string {
    if (type === 'int[]') {
        return `public static int[] convertToIntArray(Object obj) {
        if (obj == null) return null;
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            int[] result = new int[list.size()];
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i) == null) {
                    throw new IllegalArgumentException("Cannot convert null to int in array");
                }
                result[i] = ((Number) list.get(i)).intValue();
            }
            return result;
        } else if (obj instanceof Object[]) {
            Object[] array = (Object[]) obj;
            int[] result = new int[array.length];
            for (int i = 0; i < array.length; i++) {
                if (array[i] == null) {
                    throw new IllegalArgumentException("Cannot convert null to int in array");
                }
                result[i] = ((Number) array[i]).intValue();
            }
            return result;
        } else if (obj instanceof JsonArray) {
            JsonArray array = (JsonArray) obj;
            int[] result = new int[array.size()];
            for (int i = 0; i < array.size(); i++) {
                result[i] = array.get(i).getAsInt();
            }
            return result;
        } else if (obj instanceof int[]) {
            return (int[]) obj;
        }
        throw new IllegalArgumentException("Cannot convert to int array: " + obj);
    }`;
    } else if (type === 'String[]') {
        return `public static String[] convertToStringArray(Object obj) {
        if (obj == null) return null;
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            String[] result = new String[list.size()];
            for (int i = 0; i < list.size(); i++) {
                result[i] = list.get(i) == null ? null : String.valueOf(list.get(i));
            }
            return result;
        } else if (obj instanceof Object[]) {
            Object[] array = (Object[]) obj;
            String[] result = new String[array.length];
            for (int i = 0; i < array.length; i++) {
                result[i] = array[i] == null ? null : String.valueOf(array[i]);
            }
            return result;
        } else if (obj instanceof JsonArray) {
            JsonArray array = (JsonArray) obj;
            String[] result = new String[array.size()];
            for (int i = 0; i < array.size(); i++) {
                result[i] = array.get(i).isJsonNull() ? null : array.get(i).getAsString();
            }
            return result;
        } else if (obj instanceof String[]) {
            return (String[]) obj;
        }
        throw new IllegalArgumentException("Cannot convert to String array: " + obj);
    }`;
    } else if (type === 'int') {
        return `public static int convertToInt(Object obj) {
        if (obj == null) {
            throw new IllegalArgumentException("Cannot convert null to int");
        }
        if (obj instanceof Number) {
            return ((Number) obj).intValue();
        } else if (obj instanceof String) {
            try {
                return Integer.parseInt((String) obj);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Cannot convert string to int: " + obj, e);
            }
        } else if (obj instanceof JsonPrimitive) {
            return ((JsonPrimitive) obj).getAsInt();
        } else if (obj instanceof Boolean) {
            return ((Boolean) obj) ? 1 : 0;
        }
        throw new IllegalArgumentException("Cannot convert to int: " + obj);
    }`;
    } else if (type === 'String') {
        return `public static String convertToString(Object obj) {
        if (obj == null) {
            return null;
        }
        return String.valueOf(obj);
    }`;
    } else if (type === 'boolean') {
        return `public static boolean convertToBoolean(Object obj) {
        if (obj == null) {
            throw new IllegalArgumentException("Cannot convert null to boolean");
        }
        if (obj instanceof Boolean) {
            return (Boolean) obj;
        } else if (obj instanceof String) {
            String strValue = ((String) obj).toLowerCase();
            if (strValue.equals("true") || strValue.equals("yes") || strValue.equals("1")) {
                return true;
            } else if (strValue.equals("false") || strValue.equals("no") || strValue.equals("0")) {
                return false;
            }
            throw new IllegalArgumentException("Cannot convert string to boolean: " + obj);
        } else if (obj instanceof JsonPrimitive) {
            JsonPrimitive primitive = (JsonPrimitive) obj;
            if (primitive.isBoolean()) {
                return primitive.getAsBoolean();
            } else if (primitive.isNumber()) {
                return primitive.getAsInt() != 0;
            }
            throw new IllegalArgumentException("Cannot convert JsonPrimitive to boolean: " + obj);
        } else if (obj instanceof Number) {
            return ((Number) obj).intValue() != 0;
        }
        throw new IllegalArgumentException("Cannot convert to boolean: " + obj);
    }`;
    } else if (type === 'boolean[]') {
        return `public static boolean[] convertToBooleanArray(Object obj) {
        if (obj == null) return null;
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            boolean[] result = new boolean[list.size()];
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i) == null) {
                    throw new IllegalArgumentException("Cannot convert null to boolean in array");
                }
                Object element = list.get(i);
                if (element instanceof Boolean) {
                    result[i] = (Boolean) element;
                } else if (element instanceof String) {
                    String strValue = ((String) element).toLowerCase();
                    if (strValue.equals("true") || strValue.equals("yes") || strValue.equals("1")) {
                        result[i] = true;
                    } else if (strValue.equals("false") || strValue.equals("no") || strValue.equals("0")) {
                        result[i] = false;
                    } else {
                        throw new IllegalArgumentException("Cannot convert string to boolean: " + element);
                    }
                } else if (element instanceof Number) {
                    result[i] = ((Number) element).intValue() != 0;
                } else {
                    throw new IllegalArgumentException("Cannot convert to boolean: " + element);
                }
            }
            return result;
        } else if (obj instanceof Object[]) {
            Object[] array = (Object[]) obj;
            boolean[] result = new boolean[array.length];
            for (int i = 0; i < array.length; i++) {
                if (array[i] == null) {
                    throw new IllegalArgumentException("Cannot convert null to boolean in array");
                }
                Object element = array[i];
                if (element instanceof Boolean) {
                    result[i] = (Boolean) element;
                } else if (element instanceof String) {
                    String strValue = ((String) element).toLowerCase();
                    if (strValue.equals("true") || strValue.equals("yes") || strValue.equals("1")) {
                        result[i] = true;
                    } else if (strValue.equals("false") || strValue.equals("no") || strValue.equals("0")) {
                        result[i] = false;
                    } else {
                        throw new IllegalArgumentException("Cannot convert string to boolean: " + element);
                    }
                } else if (element instanceof Number) {
                    result[i] = ((Number) element).intValue() != 0;
                } else {
                    throw new IllegalArgumentException("Cannot convert to boolean: " + element);
                }
            }
            return result;
        } else if (obj instanceof JsonArray) {
            JsonArray array = (JsonArray) obj;
            boolean[] result = new boolean[array.size()];
            for (int i = 0; i < array.size(); i++) {
                if (array.get(i).isJsonNull()) {
                    throw new IllegalArgumentException("Cannot convert null to boolean in array");
                }
                JsonElement element = array.get(i);
                if (element.isJsonPrimitive()) {
                    JsonPrimitive primitive = element.getAsJsonPrimitive();
                    if (primitive.isBoolean()) {
                        result[i] = primitive.getAsBoolean();
                    } else if (primitive.isNumber()) {
                        result[i] = primitive.getAsInt() != 0;
                    } else {
                        String strValue = primitive.getAsString().toLowerCase();
                        if (strValue.equals("true") || strValue.equals("yes") || strValue.equals("1")) {
                            result[i] = true;
                        } else if (strValue.equals("false") || strValue.equals("no") || strValue.equals("0")) {
                            result[i] = false;
                        } else {
                            throw new IllegalArgumentException("Cannot convert string to boolean: " + primitive);
                        }
                    }
                } else {
                    throw new IllegalArgumentException("Cannot convert to boolean: " + element);
                }
            }
            return result;
        } else if (obj instanceof boolean[]) {
            return (boolean[]) obj;
        }
        throw new IllegalArgumentException("Cannot convert to boolean array: " + obj);
    }`;
    } else if (type === 'double') {
        return `public static double convertToDouble(Object obj) {
        if (obj == null) {
            throw new IllegalArgumentException("Cannot convert null to double");
        }
        if (obj instanceof Number) {
            return ((Number) obj).doubleValue();
        } else if (obj instanceof String) {
            try {
                return Double.parseDouble((String) obj);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Cannot convert string to double: " + obj, e);
            }
        } else if (obj instanceof JsonPrimitive) {
            return ((JsonPrimitive) obj).getAsDouble();
        } else if (obj instanceof Boolean) {
            return ((Boolean) obj) ? 1.0 : 0.0;
        }
        throw new IllegalArgumentException("Cannot convert to double: " + obj);
    }`;
    } else if (type === 'double[]') {
        return `public static double[] convertToDoubleArray(Object obj) {
        if (obj == null) return null;
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            double[] result = new double[list.size()];
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i) == null) {
                    throw new IllegalArgumentException("Cannot convert null to double in array");
                }
                result[i] = ((Number) list.get(i)).doubleValue();
            }
            return result;
        } else if (obj instanceof Object[]) {
            Object[] array = (Object[]) obj;
            double[] result = new double[array.length];
            for (int i = 0; i < array.length; i++) {
                if (array[i] == null) {
                    throw new IllegalArgumentException("Cannot convert null to double in array");
                }
                result[i] = ((Number) array[i]).doubleValue();
            }
            return result;
        } else if (obj instanceof JsonArray) {
            JsonArray array = (JsonArray) obj;
            double[] result = new double[array.size()];
            for (int i = 0; i < array.size(); i++) {
                result[i] = array.get(i).getAsDouble();
            }
            return result;
        } else if (obj instanceof double[]) {
            return (double[]) obj;
        } else if (obj instanceof int[]) {
            int[] intArray = (int[]) obj;
            double[] result = new double[intArray.length];
            for (int i = 0; i < intArray.length; i++) {
                result[i] = intArray[i];
            }
            return result;
        }
        throw new IllegalArgumentException("Cannot convert to double array: " + obj);
    }`;
    } else if (type === 'List<Integer>') {
        return `public static List<Integer> convertToIntegerList(Object obj) {
        if (obj == null) return null;
        if (obj instanceof List) {
            List<?> srcList = (List<?>) obj;
            List<Integer> result = new ArrayList<>();
            for (Object item : srcList) {
                result.add(item == null ? null : convertToInt(item));
            }
            return result;
        } else if (obj instanceof Object[]) {
            Object[] array = (Object[]) obj;
            List<Integer> result = new ArrayList<>();
            for (Object item : array) {
                result.add(item == null ? null : convertToInt(item));
            }
            return result;
        } else if (obj instanceof JsonArray) {
            JsonArray array = (JsonArray) obj;
            List<Integer> result = new ArrayList<>();
            for (int i = 0; i < array.size(); i++) {
                result.add(array.get(i).isJsonNull() ? null : array.get(i).getAsInt());
            }
            return result;
        } else if (obj instanceof int[]) {
            int[] array = (int[]) obj;
            List<Integer> result = new ArrayList<>();
            for (int item : array) {
                result.add(item);
            }
            return result;
        }
        throw new IllegalArgumentException("Cannot convert to List<Integer>: " + obj);
    }`;
    } else if (type === 'List<String>') {
        return `public static List<String> convertToStringList(Object obj) {
        if (obj == null) return null;
        if (obj instanceof List) {
            List<?> srcList = (List<?>) obj;
            List<String> result = new ArrayList<>();
            for (Object item : srcList) {
                result.add(item == null ? null : convertToString(item));
            }
            return result;
        } else if (obj instanceof Object[]) {
            Object[] array = (Object[]) obj;
            List<String> result = new ArrayList<>();
            for (Object item : array) {
                result.add(item == null ? null : convertToString(item));
            }
            return result;
        } else if (obj instanceof JsonArray) {
            JsonArray array = (JsonArray) obj;
            List<String> result = new ArrayList<>();
            for (int i = 0; i < array.size(); i++) {
                result.add(array.get(i).isJsonNull() ? null : array.get(i).getAsString());
            }
            return result;
        } else if (obj instanceof String[]) {
            String[] array = (String[]) obj;
            return Arrays.asList(array);
        }
        throw new IllegalArgumentException("Cannot convert to List<String>: " + obj);
    }`;
    } else if (type.startsWith('List<')) {
        // Generic List handler for other types
        return `public static List<?> convertToList(Object obj) {
        if (obj == null) return null;
        if (obj instanceof List) {
            return (List<?>) obj;
        } else if (obj instanceof Object[]) {
            return Arrays.asList((Object[]) obj);
        } else if (obj instanceof JsonArray) {
            JsonArray array = (JsonArray) obj;
            List<Object> result = new ArrayList<>();
            for (int i = 0; i < array.size(); i++) {
                result.add(array.get(i).isJsonNull() ? null : gson.fromJson(array.get(i), Object.class));
            }
            return result;
        } else if (obj instanceof int[]) {
            int[] array = (int[]) obj;
            List<Integer> result = new ArrayList<>();
            for (int item : array) {
                result.add(item);
            }
            return result;
        } else if (obj instanceof double[]) {
            double[] array = (double[]) obj;
            List<Double> result = new ArrayList<>();
            for (double item : array) {
                result.add(item);
            }
            return result;
        } else if (obj instanceof boolean[]) {
            boolean[] array = (boolean[]) obj;
            List<Boolean> result = new ArrayList<>();
            for (boolean item : array) {
                result.add(item);
            }
            return result;
        }
        throw new IllegalArgumentException("Cannot convert to List: " + obj);
    }`;
    } else if (type === 'char') {
        return `public static char convertToChar(Object obj) {
        if (obj == null) {
            throw new IllegalArgumentException("Cannot convert null to char");
        }
        if (obj instanceof Character) {
            return (Character) obj;
        } else if (obj instanceof String) {
            String str = (String)obj;
            if (str.length() != 1) {
                throw new IllegalArgumentException("String must have exactly one character to convert to char: " + str);
            }
            return str.charAt(0);
        } else if (obj instanceof Number) {
            return (char)((Number)obj).intValue();
        } else if (obj instanceof JsonPrimitive) {
            JsonPrimitive primitive = (JsonPrimitive)obj;
            if (primitive.isString()) {
                String str = primitive.getAsString();
                if (str.length() != 1) {
                    throw new IllegalArgumentException("String must have exactly one character to convert to char: " + str);
                }
                return str.charAt(0);
            } else if (primitive.isNumber()) {
                return (char)primitive.getAsInt();
            }
        }
        throw new IllegalArgumentException("Cannot convert to char: " + obj);
    }`;
    } else if (type === 'char[]') {
        return `public static char[] convertToCharArray(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String) {
            return ((String)obj).toCharArray();
        } else if (obj instanceof List) {
            List<?> list = (List<?>)obj;
            char[] result = new char[list.size()];
            for (int i = 0; i < list.size(); i++) {
                if (list.get(i) == null) {
                    throw new IllegalArgumentException("Cannot convert null to char in array");
                }
                Object item = list.get(i);
                if (item instanceof Character) {
                    result[i] = (Character)item;
                } else if (item instanceof String) {
                    String str = (String)item;
                    if (str.length() != 1) {
                        throw new IllegalArgumentException("String must have exactly one character to convert to char: " + str);
                    }
                    result[i] = str.charAt(0);
                } else if (item instanceof Number) {
                    result[i] = (char)((Number)item).intValue();
                } else {
                    throw new IllegalArgumentException("Cannot convert to char: " + item);
                }
            }
            return result;
        } else if (obj instanceof Object[]) {
            Object[] array = (Object[])obj;
            char[] result = new char[array.length];
            for (int i = 0; i < array.length; i++) {
                if (array[i] == null) {
                    throw new IllegalArgumentException("Cannot convert null to char in array");
                }
                Object item = array[i];
                if (item instanceof Character) {
                    result[i] = (Character)item;
                } else if (item instanceof String) {
                    String str = (String)item;
                    if (str.length() != 1) {
                        throw new IllegalArgumentException("String must have exactly one character to convert to char: " + str);
                    }
                    result[i] = str.charAt(0);
                } else if (item instanceof Number) {
                    result[i] = (char)((Number)item).intValue();
                } else {
                    throw new IllegalArgumentException("Cannot convert to char: " + item);
                }
            }
            return result;
        } else if (obj instanceof JsonArray) {
            JsonArray array = (JsonArray)obj;
            char[] result = new char[array.size()];
            for (int i = 0; i < array.size(); i++) {
                if (array.get(i).isJsonNull()) {
                    throw new IllegalArgumentException("Cannot convert null to char in array");
                }
                JsonElement element = array.get(i);
                if (element.isJsonPrimitive()) {
                    JsonPrimitive primitive = element.getAsJsonPrimitive();
                    if (primitive.isString()) {
                        String str = primitive.getAsString();
                        if (str.length() != 1) {
                            throw new IllegalArgumentException("String must have exactly one character to convert to char: " + str);
                        }
                        result[i] = str.charAt(0);
                    } else if (primitive.isNumber()) {
                        result[i] = (char)primitive.getAsInt();
                    } else {
                        throw new IllegalArgumentException("Cannot convert to char: " + primitive);
                    }
                } else {
                    throw new IllegalArgumentException("Cannot convert to char: " + element);
                }
            }
            return result;
        } else if (obj instanceof char[]) {
            return (char[])obj;
        }
        throw new IllegalArgumentException("Cannot convert to char array: " + obj);
    }`;
    } else {
        // Default Object converter for unhandled types
        return `public static Object convertToObject(Object obj) {
        return obj;
    }`;
    }
}

// Generate comparison methods based on the return type
function generateComparisonMethods(returnType: string): string {
    const methods: string[] = [];

    // Add appropriate comparison methods based on return type
    if (returnType.endsWith('[]')) {
        methods.push(generateArrayComparisonMethod(returnType));
    }

    if (returnType.startsWith('List<')) {
        methods.push(generateListComparisonMethod(returnType));
    }

    // Add char comparison method if needed
    if (returnType === 'char' || returnType === 'char[]') {
        methods.push(`public static boolean equals(char a, char b) {
        return a == b;
    }`);
    }

    // Always include basic equals method
    methods.push(`public static boolean equals(Object a, Object b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        
        // Special case for different number types
        if (a instanceof Number && b instanceof Number) {
            if (a instanceof Integer && b instanceof Integer) {
                return ((Integer)a).intValue() == ((Integer)b).intValue();
            }
            if (a instanceof Double || b instanceof Double) {
                double da = ((Number)a).doubleValue();
                double db = ((Number)b).doubleValue();
                // Handle potential floating point imprecision
                return Math.abs(da - db) < 1e-9;
            }
            return ((Number)a).doubleValue() == ((Number)b).doubleValue();
        }
        
        return a.equals(b);
    }`);

    return methods.join('\n\n    ');
}

// Generate comparison method for arrays
function generateArrayComparisonMethod(arrayType: string): string {
    const baseType = arrayType.replace('[]', '');

    if (baseType === 'double') {
        return `public static boolean equals(${arrayType} a, ${arrayType} b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;

        for (int i = 0; i < a.length; i++) {
            // Handle potential floating point imprecision
            if (Math.abs(a[i] - b[i]) > 1e-9) return false;
        }
        return true;
    }`;
    } else if (baseType === 'Object') {
        return `public static boolean equals(${arrayType} a, ${arrayType} b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;

        for (int i = 0; i < a.length; i++) {
            if (!equals(a[i], b[i])) return false;
        }
        return true;
    }`;
    } else {
        return `public static boolean equals(${arrayType} a, ${arrayType} b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        if (a.length != b.length) return false;

        for (int i = 0; i < a.length; i++) {
            if (a[i] != b[i]) return false;
        }
        return true;
    }`;
    }
}

// Generate comparison method for lists
function generateListComparisonMethod(listType: string): string {
    const genericType = listType.replace('List<', '').replace('>', '');
    
    if (genericType === 'Double') {
        return `public static boolean equals(List<?> a, List<?> b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        if (a.size() != b.size()) return false;

        for (int i = 0; i < a.size(); i++) {
            Object objA = a.get(i);
            Object objB = b.get(i);
            
            if (objA == objB) continue;
            if (objA == null || objB == null) return false;
            
            if (objA instanceof Double && objB instanceof Double) {
                // Handle potential floating point imprecision
                if (Math.abs(((Double)objA) - ((Double)objB)) > 1e-9) return false;
            } else if (!equals(objA, objB)) {
                return false;
            }
        }
        return true;
    }`;
    } else {
        return `public static boolean equals(List<?> a, List<?> b) {
        if (a == b) return true;
        if (a == null || b == null) return false;
        if (a.size() != b.size()) return false;

        for (int i = 0; i < a.size(); i++) {
            if (!equals(a.get(i), b.get(i))) return false;
        }
        return true;
    }`;
    }
}

// Helper function to get the converter method suffix for a given type
function getConverterSuffix(type: string): string {
    if (type === 'int[]') return 'ToIntArray';
    if (type === 'String[]') return 'ToStringArray';
    if (type === 'int') return 'ToInt';
    if (type === 'String') return 'ToString';
    if (type === 'boolean') return 'ToBoolean';
    if (type === 'boolean[]') return 'ToBooleanArray';
    if (type === 'double') return 'ToDouble';
    if (type === 'double[]') return 'ToDoubleArray';
    if (type === 'char') return 'ToChar';
    if (type === 'char[]') return 'ToCharArray';
    if (type === 'List<Integer>') return 'ToIntegerList';
    if (type === 'List<String>') return 'ToStringList';
    if (type.startsWith('List<')) return 'ToList';
    return 'ToObject';
}

// Helper function to get the comparison method name for a given type
function getComparisonMethod(returnType: string): string {
    return 'equals';
}