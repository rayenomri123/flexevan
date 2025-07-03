import './Controls.css'
import { VscRunAll, VscRecord, VscBookmark } from 'react-icons/vsc'

const Controls = () => {
  return (
    <div className='controls-container'>
        <div className="control-btn">
            <VscRunAll />
        </div>
        <div className="control-btn">
            <VscRecord />
        </div>
        <div className="control-btn">
            <VscBookmark />
        </div>
    </div>
  )
}

export default Controls
