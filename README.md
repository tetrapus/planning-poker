# Planning Poker App

A web application for collaborative estimation using the Planning Poker technique. Built with React and Firebase.

## Description

This web application facilitates team estimation sessions using the Planning Poker method. It allows distributed teams to collaboratively estimate task complexity or effort in real-time. Key features include:

*   Real-time updates for seamless collaboration.
*   User authentication via Firebase.
*   Selectable card decks (e.g., Fibonacci, T-shirt sizes).
*   Ability for a moderator to control the estimation flow (reveal cards, start new rounds).
*   Display of estimation results and consensus.

## Technologies Used

*   **Frontend:** React (using Create React App), react-firebase-hooks
*   **Backend/Database:** Firebase (Realtime Database/Firestore, Authentication)
*   **Styling:** Plain CSS / CSS Modules (Modify if using a specific library like Material UI, Tailwind CSS, etc.)
*   **Testing:** React Testing Library, Jest

## Getting Started

### Prerequisites

*   Node.js (v14 or later recommended)
*   npm or yarn
*   Firebase account and project setup

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone git@github.com:tetrapus/planning-poker.git
    cd planning-poker
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    # or
    # npm install
    ```

3.  **Firebase Configuration:**
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Enable Firebase Authentication (e.g., Email/Password, Google Sign-in).
    *   Enable Firestore or Realtime Database.
    *   Obtain your Firebase project configuration keys (apiKey, authDomain, etc.).
    *   Create a `.env.local` file in the project root (`planning-poker/`) and add your Firebase configuration:
        ```plaintext
        REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
        REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
        REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
        REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
        REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
        # Add database URL if using Realtime Database
        # REACT_APP_FIREBASE_DATABASE_URL=YOUR_DATABASE_URL
        ```
        *(Remember to add `.env.local` to your `.gitignore` if it's not already there - which it is in this case)*

### Running the Application

```bash
yarn start
# or
# npm start
```

This runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Building for Production

```bash
yarn build
# or
# npm run build
```

Builds the app for production to the `build` folder.

### Running Tests

```bash
yarn test
# or
# npm test
```

Launches the test runner in interactive watch mode.

## Contributing

Contributions are welcome! If you have suggestions for improvements or encounter bugs, please open an issue on the GitHub repository. Pull requests are also appreciated. Please ensure that any code changes are accompanied by relevant tests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. (Note: You should add a `LICENSE` file to the repository containing the full text of the MIT License or your chosen license).

## Acknowledgements

*   Create React App
*   Firebase
*   [Add any other libraries or resources you want to acknowledge]
