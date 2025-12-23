using System.Linq;
using UnityEngine;

public class Character : MonoBehaviour
{
    public string voice;
    public SkinnedMeshRenderer skinnedMeshRenderer = null;
    public int[] visemeToBlendTargets = Enumerable.Range(0, OVRLipSync.VisemeCount).ToArray();
}
