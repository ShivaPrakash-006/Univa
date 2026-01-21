function MyButton({title} : {title : string}) {
  return (
    <button>{title}</button>
  );
}

export default function MyApp() {
  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton title="I'm a button"/>
      <MyButton title="I'm another button"/>
      <MyButton title="I'm the third button"/>
    </div>
  );
}
