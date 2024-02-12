import _ from 'lodash';
import SomeMessage from './SomeComponent';
import {useState} from 'preact/hooks';

export default function TodoListComponent() {
  const [list, setList] = useState([]);
  const [id, setId] = useState(0);

  function addNew(task) {
    const newList = _.cloneDeep(list);
    for (let i = 0; i < 300; i++) {
      setId(id + 1 + i);
      newList.push({
        id: id + 1 + i,
        task: task,
        checked: false,
      });
    }
    setList(newList);
  }

  function changeCheck(i) {
    const newList = _.cloneDeep(list);
    newList[i].checked = !newList[i].checked;
    setList(newList);
  }

  function remove(id) {
    setList(_.filter(list, (l2) => l2.id !== id));
  }

  return (
    <div>
      <div><SomeMessage/></div>
      <div>{list.length} {_.filter(list, {checked: true}).length}</div>
      <div>
        <form onChange={(e) => addNew(e.req.body['task-value'])}>
          <input type="text" name="task-value"/>
          <button type="submit">Add</button>
        </form>
      </div>
      <div>
        {_.map(list, (l, i) => (
          <div key={l.id}>
            {l.id}
            <input type="checkbox" defaultChecked={l.checked} onChange={() => changeCheck(i)}/>
            {l.task}
            <button onChange={() => remove(l.id)}>
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
