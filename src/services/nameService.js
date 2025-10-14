export function generateName() {
    const adjectives = ["Brave", "Cowardly", "Calm", "Wrathful", "Skinny", "Fat", "Magnanimous", "Dastardly", "Earnest", "Slothful", "Swift", "Slow"];
    const animals = ["Tiger", "Lion", "Bear", "Tortoise", "Turtle", "Salmon", "Chicken", "sloth", "Anteater", "Mouse", "Dog", "Cat", "Panda", "Porcupine"];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];

    return `${randomAdjective}${randomAnimal}`;
}